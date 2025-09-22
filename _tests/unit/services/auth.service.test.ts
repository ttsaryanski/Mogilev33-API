import bcrypt from "bcrypt";
import * as jwt from "../../../src/lib/jwt.js";

import { authService } from "../../../src/services/authService.js";
import { User } from "../../../src/models/User.js";
import { InvalidToken } from "../../../src/models/InvalidToken.js";

import {
    LoginUserResponseType,
    UserResponseType,
} from "../../../src/types/UserTypes.js";
import { CreateUserDataType } from "../../../src/validators/user.schema.js";

import { CustomError } from "../../../src/utils/errorUtils/customError.js";

jest.mock("bcrypt");
jest.mock("../../../src/lib/jwt.js");
jest.mock("../../../src/models/User.js");
jest.mock("../../../src/models/InvalidToken.js");

process.env.JWT_SECRET = "test-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

interface MockUserInterface {
    _id: string;
    email: string;
    role: string;
    password: string;
    createdAt: Date;
}
type UserModelType = typeof User;
const mockedUser = User as jest.Mocked<UserModelType>;

jest.mock("../../../src/models/User.js", () => ({
    User: {
        findOne: jest.fn(),
        create: jest.fn(),
        findById: jest.fn(),
    },
}));
jest.mock("../../../src/models/InvalidToken.js", () => ({
    InvalidToken: {
        create: jest.fn(),
    },
}));

describe("auth/register", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create user and return access token", async () => {
        const registerData: CreateUserDataType = {
            email: "register@email.com",
            password: "123456",
        };
        const mockUser: Partial<MockUserInterface> = {
            _id: "userId",
            email: "register@email.com",
            role: "user",
            password: "hashedPassword",
            createdAt: new Date(),
        };
        (mockedUser.findOne as jest.Mock).mockResolvedValue(null);
        (mockedUser.create as jest.Mock).mockResolvedValue(mockUser);
        (jwt.signJwt as jest.Mock).mockResolvedValue("signedToken");
        const result = await authService.register(registerData);

        expect(mockedUser.findOne).toHaveBeenCalledWith({
            email: registerData.email,
        });
        expect(mockedUser.create).toHaveBeenCalledWith(registerData);
        expect(jwt.signJwt).toHaveBeenCalledTimes(2);
        expect(result).toEqual({
            accessToken: "signedToken",
            refreshToken: "signedToken",
        });
    });

    it("should throw if email already exists", async () => {
        const registerData: CreateUserDataType = {
            email: "register@email.com",
            password: "123456",
        };
        const existingUser: Partial<MockUserInterface> = {
            _id: "userId",
            email: registerData.email,
            role: "user",
            password: "hashedPassword",
            createdAt: new Date(),
        };
        (mockedUser.findOne as jest.Mock).mockResolvedValue(existingUser);
        await expect(authService.register(registerData)).rejects.toThrow(
            new CustomError("This email already registered!", 409)
        );
        expect(mockedUser.findOne).toHaveBeenCalledWith({
            email: registerData.email,
        });
        expect(mockedUser.create).not.toHaveBeenCalled();
        expect(jwt.signJwt).not.toHaveBeenCalled();
    });
});

describe("auth/login", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should login user and return access token", async () => {
        const loginData: CreateUserDataType = {
            email: "login@email.com",
            password: "123456",
        };
        const mockUser: Partial<MockUserInterface> = {
            _id: "userId",
            email: loginData.email,
            role: "user",
            password: "hashedPassword",
            createdAt: new Date(),
        };
        (mockedUser.findOne as jest.Mock).mockResolvedValue(
            mockUser as LoginUserResponseType
        );
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (jwt.signJwt as jest.Mock).mockResolvedValue("signedToken");
        const result = await authService.login(loginData);

        expect(mockedUser.findOne).toHaveBeenCalledWith({
            email: loginData.email,
        });
        expect(bcrypt.compare).toHaveBeenCalledWith(
            loginData.password,
            mockUser.password
        );
        expect(jwt.signJwt).toHaveBeenCalledTimes(2);
        expect(result).toEqual({
            accessToken: "signedToken",
            refreshToken: "signedToken",
        });
    });

    it("should throw if user does not exist", async () => {
        const loginData: CreateUserDataType = {
            email: "notexisting@email.com",
            password: "123456",
        };
        (mockedUser.findOne as jest.Mock).mockResolvedValue(null);
        await expect(authService.login(loginData)).rejects.toThrow(
            new CustomError("User does not exist!", 404)
        );
        expect(mockedUser.findOne).toHaveBeenCalledWith({
            email: loginData.email,
        });
        expect(bcrypt.compare).not.toHaveBeenCalled();
        expect(jwt.signJwt).not.toHaveBeenCalled();
    });

    it("should throw if password does not match", async () => {
        const loginData: CreateUserDataType = {
            email: "login@email.com",
            password: "wrongpassword",
        };
        const mockUser: Partial<MockUserInterface> = {
            _id: "userId",
            email: loginData.email,
            role: "user",
            password: "hashedPassword",
            createdAt: new Date(),
        };
        (mockedUser.findOne as jest.Mock).mockResolvedValue(
            mockUser as LoginUserResponseType
        );
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        await expect(authService.login(loginData)).rejects.toThrow(
            new CustomError("Password does not match!", 401)
        );
        expect(mockedUser.findOne).toHaveBeenCalledWith({
            email: loginData.email,
        });
        expect(bcrypt.compare).toHaveBeenCalledWith(
            loginData.password,
            mockUser.password
        );
        expect(jwt.signJwt).not.toHaveBeenCalled();
    });
});

describe("auth/logout", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should logout user by storing refresh token", async () => {
        const tokens = {
            accessToken: "accessToken",
            refreshToken: "refreshToken",
        };
        await authService.logout(tokens);
        expect(InvalidToken.create).toHaveBeenCalledWith({
            token: tokens.refreshToken,
        });
    });
});

describe("auth/getUserById", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return user data without password", async () => {
        const mockUser: Partial<MockUserInterface> = {
            _id: "userId",
            email: "example@email.com",
            password: "hashedPassword",
            role: "user",
            createdAt: new Date(),
        };
        (mockedUser.findById as jest.Mock).mockResolvedValue(
            mockUser as UserResponseType
        );
        const result = await authService.getUserById("userId");
        expect(mockedUser.findById).toHaveBeenCalledWith("userId", {
            password: 0,
            __v: 0,
        });
        expect(result).toEqual({
            _id: mockUser._id,
            email: mockUser.email,
            role: mockUser.role,
            createdAt: mockUser.createdAt,
        });
    });

    it("should throw if user not found", async () => {
        (mockedUser.findById as jest.Mock).mockResolvedValue(null);
        await expect(authService.getUserById("nonExistingId")).rejects.toThrow(
            new CustomError("There is no user with this id!", 404)
        );
        expect(mockedUser.findById).toHaveBeenCalledWith("nonExistingId", {
            password: 0,
            __v: 0,
        });
    });
});
