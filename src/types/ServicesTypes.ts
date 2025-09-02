import { UserResponseType } from "./UserTypes.js";
import { CreateUserDataType } from "../validators/user.schema.js";

import { ProtocolResponseType } from "./ProtocolTypes.js";
import { CreateProtocolDataType } from "../validators/protocol.schema.js";

import { OfferResponseType } from "./OfferTypes.js";
import { CreateOfferDataType } from "../validators/offer.schema.js";

import { InviteResponseType } from "./InviteTypes.js";
import { CreateInviteDataType } from "../validators/invite.schema.js";

export interface ProtocolServicesTypes {
    getAll(): Promise<ProtocolResponseType[]>;
    create(data: CreateProtocolDataType): Promise<ProtocolResponseType>;
    edit(
        protocolId: string,
        data: CreateProtocolDataType
    ): Promise<ProtocolResponseType>;
    remove(protocolId: string): Promise<void>;
    getById(protocolId: string): Promise<ProtocolResponseType>;
}

export interface OfferServicesTypes {
    getAll(): Promise<OfferResponseType[]>;
    create(data: CreateOfferDataType): Promise<OfferResponseType>;
    edit(
        offerId: string,
        data: CreateOfferDataType
    ): Promise<OfferResponseType>;
    remove(offerId: string): Promise<void>;
    getById(offerId: string): Promise<OfferResponseType>;
}

export interface InviteServicesTypes {
    getAll(): Promise<InviteResponseType[]>;
    create(data: CreateInviteDataType): Promise<InviteResponseType>;
    edit(
        inviteId: string,
        data: CreateInviteDataType
    ): Promise<InviteResponseType>;
    remove(inviteId: string): Promise<void>;
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
