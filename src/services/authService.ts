import bcrypt from "bcrypt";
import { signJwt } from "../lib/jwt.js";

import { CustomError } from "../utils/errorUtils/customError.js";

import { User } from "../models/User.js";
import { InvalidToken } from "../models/InvalidToken.js";

import { AuthServicesTypes } from "../types/ServicesTypes.js";
import { UserResponseType, LoginUserResponseType } from "../types/UserTypes.js";
import { CreateUserDataType } from "../validators/user.schema.js";

export const authService: AuthServicesTypes = {
    async register(
        data: CreateUserDataType
    ): Promise<{ accessToken: string; refreshToken: string }> {
        const existingUser = await User.findOne({ email: data.email });

        if (existingUser) {
            throw new CustomError("This email already registered!", 409);
        }

        const createdUser = (await User.create(data)) as UserResponseType;

        return createAccessTokens({
            _id: createdUser._id.toString(),
            email: createdUser.email,
            role: createdUser.role,
        });
    },

    async login(
        data: CreateUserDataType
    ): Promise<{ accessToken: string; refreshToken: string }> {
        const user = (await User.findOne({
            email: data.email,
        })) as LoginUserResponseType;

        if (!user) {
            throw new CustomError("User does not exist!", 404);
        }

        const isValid = await bcrypt.compare(data.password, user.password);

        if (!isValid) {
            throw new CustomError("Password does not match!", 401);
        }

        return createAccessTokens({
            _id: user._id.toString(),
            email: user.email,
            role: user.role,
        });
    },

    async logout(token: {
        accessToken: string;
        refreshToken: string;
    }): Promise<void> {
        await InvalidToken.create({ token: token.refreshToken });
    },

    async getUserById(id: string): Promise<UserResponseType> {
        const user = (await User.findById(id, {
            password: 0,
            __v: 0,
        })) as UserResponseType;

        if (!user) {
            throw new CustomError("There is no user with this id!", 404);
        }

        return {
            _id: user._id.toString(),
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
        };
    },
};

type AccessTokenUser = {
    _id: string;
    email: string;
    role: string;
};

export async function createAccessTokens(user: AccessTokenUser) {
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
        throw new CustomError("JWT secret is not configured!", 500);
    }

    const payload = {
        _id: user._id,
        email: user.email,
        role: user.role,
    };

    const accessToken = await signJwt(payload, process.env.JWT_SECRET, {
        expiresIn: "15m",
    });

    const refreshToken = await signJwt(
        payload,
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: "7d",
        }
    );

    return { accessToken, refreshToken };
}
