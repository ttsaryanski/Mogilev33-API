import mongoose, { Schema, Document } from "mongoose";

export interface IProtocol extends Document {
    title: string;
    date: string;
    fileUrl: string;
    createdAt: Date;
}

const ProtocolSchema = new Schema<IProtocol>({
    title: {
        type: String,
        required: [true, "Protocol title is required!"],
        minLength: [3, "Protocol title should be at least 3 characters long!"],
    },
    date: {
        type: String,
        required: [true, "Protocol date is required!"],
    },
    fileUrl: {
        type: String,
        required: [true, "Protocol file URL is required!"],
    },
    createdAt: { type: Date, default: Date.now },
});

export const Protocol = mongoose.model<IProtocol>("Protocol", ProtocolSchema);
