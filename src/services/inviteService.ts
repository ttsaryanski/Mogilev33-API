import { Invite } from "../models/Invite.js";

import { InviteServicesTypes } from "../types/ServicesTypes.js";
import { InviteResponseType } from "../types/InviteTypes.js";
import { CreateInviteDataType } from "../validators/invite.schema.js";

import { CustomError } from "../utils/errorUtils/customError.js";

export const inviteService: InviteServicesTypes = {
    async getAll(): Promise<InviteResponseType[]> {
        const invitations = await Invite.find().select("-__v").lean();

        return invitations.map((invite) => ({
            _id: invite._id.toString(),
            title: invite.title,
            date: invite.date,
            fileUrl: invite.fileUrl,
            createdAt: invite.createdAt,
        }));
    },

    async create(data: CreateInviteDataType): Promise<InviteResponseType> {
        const newInvite = (await Invite.create(data)) as InviteResponseType;
        return {
            _id: newInvite._id.toString(),
            title: newInvite.title,
            date: newInvite.date,
            fileUrl: newInvite.fileUrl,
            createdAt: newInvite.createdAt,
        };
    },

    async edit(
        inviteId: string,
        data: CreateInviteDataType
    ): Promise<InviteResponseType> {
        const updatedInvite = (await Invite.findByIdAndUpdate(inviteId, data, {
            runValidators: true,
            new: true,
        })) as InviteResponseType;

        if (!updatedInvite) {
            throw new CustomError("Invite not found!", 404);
        }
        return {
            _id: updatedInvite._id.toString(),
            title: updatedInvite.title,
            date: updatedInvite.date,
            fileUrl: updatedInvite.fileUrl,
            createdAt: updatedInvite.createdAt,
        };
    },

    async remove(inviteId: string): Promise<void> {
        const result = await Invite.findByIdAndDelete(inviteId);

        if (!result) {
            throw new CustomError("Invite not found!", 404);
        }
    },

    async getById(inviteId: string): Promise<InviteResponseType> {
        const invite = (await Invite.findById(inviteId)) as InviteResponseType;

        if (!invite) {
            throw new CustomError("Invite not found!", 404);
        }

        return {
            _id: invite._id.toString(),
            title: invite.title,
            date: invite.date,
            fileUrl: invite.fileUrl,
            createdAt: invite.createdAt,
        };
    },
};
