import { Protocol } from "../models/Protocol.js";

import { ProtocolServicesTypes } from "../types/ServicesTypes.js";
import { ProtocolResponseType } from "../types/ProtocolTypes.js";
import { CreateProtocolDataType } from "../validators/protocol.schema.js";

import { CustomError } from "../utils/errorUtils/customError.js";

export const protocolService: ProtocolServicesTypes = {
    async getAll(): Promise<ProtocolResponseType[]> {
        const protocols = await Protocol.find().select("-__v").lean();

        return protocols.map((protocol) => ({
            _id: protocol._id.toString(),
            title: protocol.title,
            date: protocol.date,
            fileUrl: protocol.fileUrl,
            createdAt: protocol.createdAt,
        }));
    },

    async create(data: CreateProtocolDataType): Promise<ProtocolResponseType> {
        const newProtocol = (await Protocol.create(
            data
        )) as ProtocolResponseType;
        return {
            _id: newProtocol._id.toString(),
            title: newProtocol.title,
            date: newProtocol.date,
            fileUrl: newProtocol.fileUrl,
            createdAt: newProtocol.createdAt,
        };
    },

    async edit(
        protocolId: string,
        data: CreateProtocolDataType
    ): Promise<ProtocolResponseType> {
        const updatedProtocol = (await Protocol.findByIdAndUpdate(
            protocolId,
            data,
            {
                runValidators: true,
                new: true,
            }
        )) as ProtocolResponseType;

        if (!updatedProtocol) {
            throw new CustomError("Protocol not found!", 404);
        }
        return {
            _id: updatedProtocol._id.toString(),
            title: updatedProtocol.title,
            date: updatedProtocol.date,
            fileUrl: updatedProtocol.fileUrl,
            createdAt: updatedProtocol.createdAt,
        };
    },

    async remove(protocolId: string): Promise<void> {
        const result = await Protocol.findByIdAndDelete(protocolId);

        if (!result) {
            throw new CustomError("Protocol not found!", 404);
        }
    },

    async getById(protocolId: string): Promise<ProtocolResponseType> {
        const protocol = (await Protocol.findById(
            protocolId
        )) as ProtocolResponseType;

        if (!protocol) {
            throw new CustomError("Protocol not found!", 404);
        }

        return {
            _id: protocol._id.toString(),
            title: protocol.title,
            date: protocol.date,
            fileUrl: protocol.fileUrl,
            createdAt: protocol.createdAt,
        };
    },
};
