import mongoose, { Schema, Document } from "mongoose";

export interface IOffer extends Document {
    title: string;
    company: string;
    price: number;
    fileUrl: string;
    createdAt: Date;
}

const OfferSchema = new Schema<IOffer>({
    title: {
        type: String,
        required: [true, "Offer title is required!"],
        minLength: [3, "Offer title should be at least 3 characters long!"],
    },
    company: {
        type: String,
        required: [true, "Company name is required!"],
        minLength: [2, "Company name should be at least 2 characters long!"],
    },
    price: {
        type: Number,
        required: [true, "Price is required!"],
        min: [0, "Price must be a positive number!"],
    },
    fileUrl: {
        type: String,
        required: [true, "Offer file URL is required!"],
    },
    createdAt: { type: Date, default: Date.now },
});

export const Offer = mongoose.model<IOffer>("Offer", OfferSchema);
