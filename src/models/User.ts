import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
    email: string;
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
    password: {
        type: String,
        required: [true, "Password is required!"],
        minLength: [6, "Password should be at least 6 characters long!"],
    },
    createdAt: { type: Date, default: Date.now },
});

UserSchema.pre("save", async function () {
    if (this.isModified("password")) {
        const hash = await bcrypt.hash(this.password, 10);
        this.password = hash;
    }
});

export const User = mongoose.model<IUser>("User", UserSchema);
