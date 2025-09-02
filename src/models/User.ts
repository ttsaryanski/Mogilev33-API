import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
    email: string;
    role: string;
    password: string;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>({
    email: {
        type: String,
        required: [true, "Email is required!"],
        unique: true,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address!"],
    },
    role: { type: String, default: "user" },
    password: {
        type: String,
        required: [true, "Password is required!"],
        minLength: [6, "Password should be at least 6 characters long!"],
    },
    createdAt: { type: Date, default: Date.now },
});

UserSchema.pre("save", async function (next) {
    try {
        if (this.isModified("password")) {
            const hash = await bcrypt.hash(this.password, 10);
            this.password = hash;
        }
        next();
    } catch (err) {
        next(err as mongoose.CallbackError);
    }
});

export const User = mongoose.model<IUser>("User", UserSchema);
