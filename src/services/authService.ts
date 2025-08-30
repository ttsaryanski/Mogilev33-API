import { User } from "../models/User.js";

import { AuthServicesTypes } from "../types/ServicesTypes.js";
import { UserResponseType } from "../types/UserTypes.js";
import { CreateUserDataType } from "../validators/user.schema.js";

export const authService: AuthServicesTypes = {
    async register(data: CreateUserDataType): Promise<string> {
        const user = await User.create(data);
        return "test";
    },

    async login(data: CreateUserDataType): Promise<string> {
        const user = await User.findOne({ email: data.email });

        return "test";
    },

    async logout() {
        // Implement logout logic if needed
    },

    async getUserById(): Promise<UserResponseType> {
        // Implement logic to get user by ID if needed
        return {
            _id: "testId",
            email: "test@email.email",
            createdAt: new Date(),
        };
    },
};
