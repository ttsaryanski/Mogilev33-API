import { UserResponseType } from "./UserTypes.js";
import { CreateUserDataType } from "../validators/user.schema.js";

import { ProtocolResponseType } from "./ProtocolTypes.js";
import {
    CreateProtocolDataType,
    CreateProtocolWithUploadDataType,
} from "../validators/protocol.schema.js";

import { OfferResponseType } from "./OfferTypes.js";
import {
    CreateOfferDataType,
    CreateOfferWithUploadDataType,
} from "../validators/offer.schema.js";

import { InviteResponseType } from "./InviteTypes.js";
import {
    CreateInviteDataType,
    CreateInviteWithUploadDataType,
} from "../validators/invite.schema.js";

export interface ProtocolServicesTypes {
    getAll(): Promise<ProtocolResponseType[]>;
    create(data: CreateProtocolDataType): Promise<ProtocolResponseType>;
    createWithFile(
        data: CreateProtocolWithUploadDataType,
        file: Express.Multer.File
    ): Promise<ProtocolResponseType>;
    edit(
        protocolId: string,
        data: CreateProtocolDataType
    ): Promise<ProtocolResponseType>;
    editWithFile(
        protocolId: string,
        data: CreateProtocolWithUploadDataType,
        file: Express.Multer.File
    ): Promise<ProtocolResponseType>;
    remove(protocolId: string): Promise<void>;
    removeAndRemoveFromGCS(protocolId: string): Promise<void>;
    getById(protocolId: string): Promise<ProtocolResponseType>;
}

export interface OfferServicesTypes {
    getAll(): Promise<OfferResponseType[]>;
    create(data: CreateOfferDataType): Promise<OfferResponseType>;
    createWithFile(
        data: CreateOfferWithUploadDataType,
        file: Express.Multer.File
    ): Promise<OfferResponseType>;
    edit(
        offerId: string,
        data: CreateOfferDataType
    ): Promise<OfferResponseType>;
    editWithFile(
        offerId: string,
        data: CreateOfferWithUploadDataType,
        file: Express.Multer.File
    ): Promise<OfferResponseType>;
    remove(offerId: string): Promise<void>;
    removeAndRemoveFromGCS(offerId: string): Promise<void>;
    getById(offerId: string): Promise<OfferResponseType>;
}

export interface InviteServicesTypes {
    getAll(): Promise<InviteResponseType[]>;
    create(data: CreateInviteDataType): Promise<InviteResponseType>;
    createWithFile(
        data: CreateInviteWithUploadDataType,
        file: Express.Multer.File
    ): Promise<InviteResponseType>;
    edit(
        inviteId: string,
        data: CreateInviteDataType
    ): Promise<InviteResponseType>;
    editWithFile(
        inviteId: string,
        data: CreateInviteWithUploadDataType,
        file: Express.Multer.File
    ): Promise<InviteResponseType>;
    remove(inviteId: string): Promise<void>;
    removeAndRemoveFromGCS(inviteId: string): Promise<void>;
    getById(inviteId: string): Promise<InviteResponseType>;
}

export interface AuthServicesTypes {
    register(
        data: CreateUserDataType
    ): Promise<{ accessToken: string; refreshToken: string }>;
    login(
        data: CreateUserDataType
    ): Promise<{ accessToken: string; refreshToken: string }>;
    logout(token: { accessToken: string; refreshToken: string }): Promise<void>;
    getUserById(id: string): Promise<UserResponseType>;
}

export interface GCSServiceTypes {
    uploadFile(file: Express.Multer.File): Promise<string>;
    deleteFile(filePath: string): Promise<void>;
}
