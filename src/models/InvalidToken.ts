import mongoose, { Schema, Document } from "mongoose";

export interface IInvalidToken extends Document {
    token: string;
    createdAt: Date;
}

const InvalidTokenSchema = new Schema<IInvalidToken>({
    token: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: "2d",
    },
});

export const InvalidToken = mongoose.model<IInvalidToken>(
    "InvalidToken",
    InvalidTokenSchema
);
