import mongoose, { Schema, Document } from "mongoose";

export interface IInvite extends Document {
    title: string;
    date: string;
    fileUrl: string;
    createdAt: Date;
}

const InviteSchema = new Schema<IInvite>({
    title: {
        type: String,
        required: [true, "Invite title is required!"],
        minLength: [3, "Invite title should be at least 3 characters long!"],
    },
    date: {
        type: String,
        required: [true, "Invite date is required!"],
    },
    fileUrl: {
        type: String,
        required: [true, "Invite file URL is required!"],
    },
    createdAt: { type: Date, default: Date.now },
});

export const Invite = mongoose.model<IInvite>("Invite", InviteSchema);
