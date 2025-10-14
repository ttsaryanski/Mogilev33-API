import dotenv from "dotenv";
dotenv.config();

import { protocolService } from "../../../src/services/protocolService.js";
import { gcsService } from "../../../src/services/gcsService.js";

import { Protocol } from "../../../src/models/Protocol.js";

import { ProtocolResponseType } from "../../../src/types/ProtocolTypes.js";
import {
    CreateProtocolDataType,
    CreateProtocolWithUploadDataType,
} from "../../../src/validators/protocol.schema.js";

import { CustomError } from "../../../src/utils/errorUtils/customError.js";

interface MockProtocolInterface {
    _id: string;
    title: string;
    date: string;
    fileUrl: string;
    createdAt: Date;
}
type ProtocolModelType = typeof Protocol;
const mockedProtocol = Protocol as jest.Mocked<ProtocolModelType>;

jest.mock("../../../src/models/Protocol.js", () => ({
    Protocol: {
        find: jest.fn(),
        create: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        findByIdAndDelete: jest.fn(),
        findById: jest.fn(),
    },
}));
jest.mock("../../../src/services/gcsService.js", () => ({
    gcsService: {
        uploadFile: jest.fn(),
        deleteFile: jest.fn(),
    },
}));
const mockGcsService = gcsService as jest.Mocked<typeof gcsService>;

const mockFile = {
    originalname: "test.pdf",
    mimetype: "application/pdf",
    buffer: Buffer.from("test"),
    size: 1234,
} as Express.Multer.File;

const bucket = process.env.GCS_BUCKET_NAME || "test-bucket";

describe("protocolService/getAll()", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return array from all protocols", async () => {
        const mockData: Partial<MockProtocolInterface>[] = [
            {
                _id: "id1",
                title: "Title 1",
                date: "2024/01/01",
                fileUrl: "https://example.com/file1.pdf",
                createdAt: new Date("2024-01-01"),
            },
            {
                _id: "id2",
                title: "Title 2",
                date: "2024/01/02",
                fileUrl: "https://example.com/file2.pdf",
                createdAt: new Date("2024-01-02"),
            },
        ];
        const leanMock = jest.fn().mockResolvedValue(mockData);
        const selectMock = jest.fn().mockReturnValue({ lean: leanMock });
        (mockedProtocol.find as jest.Mock).mockReturnValue({
            select: selectMock,
        });

        const result = await protocolService.getAll();

        const expected: ProtocolResponseType[] = [
            {
                _id: "id1",
                title: "Title 1",
                date: "2024/01/01",
                fileUrl: "https://example.com/file1.pdf",
                createdAt: new Date("2024-01-01"),
            },
            {
                _id: "id2",
                title: "Title 2",
                date: "2024/01/02",
                fileUrl: "https://example.com/file2.pdf",
                createdAt: new Date("2024-01-02"),
            },
        ];

        expect(result).toEqual(expected);
        expect(mockedProtocol.find).toHaveBeenCalled();
        expect(mockedProtocol.find).toHaveBeenCalledTimes(1);
        expect(selectMock).toHaveBeenCalledWith("-__v");
        expect(leanMock).toHaveBeenCalledTimes(1);
    });
});

describe("protocolService/create", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should create and return new protocol", async () => {
        const createData: CreateProtocolDataType = {
            title: "Test title",
            date: "2024/12/31",
            fileUrl: "https://example.com/protocol.pdf",
        };

        const mockProtocol: Partial<MockProtocolInterface> = {
            _id: "id1",
            title: "Test title",
            date: "2024/12/31",
            fileUrl: "https://example.com/protocol.pdf",
            createdAt: new Date("2024-01-01"),
        };

        (mockedProtocol.create as jest.Mock).mockResolvedValue(mockProtocol);

        const result = await protocolService.create(createData);

        const expected: ProtocolResponseType = {
            _id: "id1",
            title: "Test title",
            date: "2024/12/31",
            fileUrl: "https://example.com/protocol.pdf",
            createdAt: new Date("2024-01-01"),
        };

        expect(result).toEqual(expected);
        expect(mockedProtocol.create).toHaveBeenCalledWith(createData);
    });
});

describe("protocolService/createWithFile", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create and return new protocol", async () => {
        const createData: CreateProtocolWithUploadDataType = {
            title: "Test title",
            date: "2024/12/31",
            file: mockFile,
        };
        const mockProtocol: Partial<MockProtocolInterface> = {
            _id: "id1",
            title: "Test title",
            date: "2024/12/31",
            fileUrl: "https://storage.fake/test.pdf",
            createdAt: new Date("2024-01-01"),
        };
        mockGcsService.uploadFile.mockResolvedValue(
            "https://storage.fake/test.pdf"
        );
        (mockedProtocol.create as jest.Mock).mockResolvedValue(mockProtocol);

        const result = await protocolService.createWithFile(
            createData,
            mockFile
        );

        const expected: ProtocolResponseType = {
            _id: "id1",
            title: "Test title",
            date: "2024/12/31",
            fileUrl: "https://storage.fake/test.pdf",
            createdAt: new Date("2024-01-01"),
        };

        expect(result).toEqual(expected);
        expect(mockedProtocol.create).toHaveBeenCalledWith({
            ...createData,
            fileUrl: "https://storage.fake/test.pdf",
        });
        expect(mockGcsService.uploadFile).toHaveBeenCalledWith(mockFile);
    });
});

describe("protocolService/edit", () => {
    it("should update and return the updated protocol", async () => {
        const protocolId = "id1";
        const updateData: CreateProtocolDataType = {
            title: "Updated title",
            date: "2024/11/30",
            fileUrl: "https://example.com/updated.pdf",
        };
        const mockUpdate: Partial<MockProtocolInterface> = {
            _id: protocolId,
            ...updateData,
            createdAt: new Date("2024-01-01"),
        };

        mockedProtocol.findByIdAndUpdate.mockResolvedValue(
            mockUpdate as MockProtocolInterface
        );

        const result = await protocolService.edit(protocolId, updateData);

        const expected: ProtocolResponseType = {
            _id: protocolId,
            title: "Updated title",
            date: "2024/11/30",
            fileUrl: "https://example.com/updated.pdf",
            createdAt: new Date("2024-01-01"),
        };

        expect(mockedProtocol.findByIdAndUpdate).toHaveBeenCalledWith(
            protocolId,
            updateData,
            {
                runValidators: true,
                new: true,
            }
        );
        expect(result).toEqual(expected);
    });

    it("should throw CustomError if no protocol is found to update", async () => {
        mockedProtocol.findByIdAndUpdate.mockResolvedValue(null);

        await expect(
            protocolService.edit("id1", { title: "x", date: "y", fileUrl: "z" })
        ).rejects.toThrow(CustomError);
    });
});

describe("protocolService/editWithFile", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should update and return the updated protocol", async () => {
        const protocolId = "id1";
        const updateData: CreateProtocolWithUploadDataType = {
            title: "Updated title",
            date: "2025/12/31",
            file: mockFile,
        };

        const oldProtocol = {
            _id: protocolId,
            title: "Old title",
            date: "2024/01/01",
            fileUrl: `https://storage.googleapis.com/${bucket}/old.pdf`,
            createdAt: new Date("2024-01-01"),
        };
        (mockedProtocol.findById as jest.Mock).mockResolvedValue(oldProtocol);
        const mockUpdate: Partial<MockProtocolInterface> = {
            _id: protocolId,
            title: "Updated title",
            date: "2025/12/31",
            fileUrl: `https://storage.googleapis.com/${bucket}/test.pdf`,
            createdAt: new Date("2024-01-01"),
        };
        (mockedProtocol.findByIdAndUpdate as jest.Mock).mockResolvedValue(
            mockUpdate
        );
        mockGcsService.deleteFile.mockResolvedValue();
        mockGcsService.uploadFile.mockResolvedValue(
            `https://storage.googleapis.com/${bucket}/test.pdf`
        );

        const result = await protocolService.editWithFile(
            protocolId,
            updateData,
            mockFile
        );

        const expected: ProtocolResponseType = {
            _id: protocolId,
            title: "Updated title",
            date: "2025/12/31",
            fileUrl: `https://storage.googleapis.com/${bucket}/test.pdf`,
            createdAt: new Date("2024-01-01"),
        };

        expect(Protocol.findById).toHaveBeenCalledWith(protocolId);
        expect(result).toEqual(expected);
        expect(result._id).toBe(protocolId);
        expect(mockedProtocol.findByIdAndUpdate).toHaveBeenCalledWith(
            protocolId,
            {
                ...updateData,
                fileUrl: `https://storage.googleapis.com/${bucket}/test.pdf`,
            },
            {
                runValidators: true,
                new: true,
            }
        );
        expect(mockGcsService.deleteFile).toHaveBeenCalledWith("old.pdf");
        expect(mockGcsService.uploadFile).toHaveBeenCalledWith(mockFile);
    });

    it("should throw CustomError if no protocol is found to update", async () => {
        mockedProtocol.findById.mockResolvedValue(null);

        await expect(
            protocolService.editWithFile(
                "id1",
                {
                    title: "x",
                    date: "y",
                    file: mockFile,
                },
                mockFile
            )
        ).rejects.toThrow(CustomError);
        expect(gcsService.deleteFile).not.toHaveBeenCalled();
        expect(gcsService.uploadFile).not.toHaveBeenCalled();
    });
});

describe("protocolService/remove", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should delete a protocol", async () => {
        const mockDelete: Partial<MockProtocolInterface> = {
            _id: "id1",
            title: "to delete",
            date: "2024/10/10",
            fileUrl: "https://example.com/delete.pdf",
            createdAt: new Date("2024-01-01"),
        };
        mockedProtocol.findByIdAndDelete.mockResolvedValue(
            mockDelete as MockProtocolInterface
        );

        await protocolService.remove("id1");

        expect(mockedProtocol.findByIdAndDelete).toHaveBeenCalledWith("id1");
    });

    it("should throw CustomError when protocol not found!", async () => {
        mockedProtocol.findByIdAndDelete.mockResolvedValue(null);

        await expect(protocolService.remove("id1")).rejects.toThrow(
            CustomError
        );
    });
});

describe("protocolService/removeAndRemoveFromGCS", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should delete a protocol", async () => {
        const mockDelete: Partial<MockProtocolInterface> = {
            _id: "id1",
            title: "to delete",
            date: "2024/10/10",
            fileUrl: `https://storage.googleapis.com/${bucket}/delete.pdf`,
            createdAt: new Date("2024-01-01"),
        };
        (mockedProtocol.findById as jest.Mock).mockResolvedValue(mockDelete);
        mockGcsService.deleteFile.mockResolvedValue();
        mockedProtocol.findByIdAndDelete.mockResolvedValue(
            mockDelete as MockProtocolInterface
        );

        await protocolService.removeAndRemoveFromGCS("id1");

        expect(mockedProtocol.findByIdAndDelete).toHaveBeenCalledWith("id1");
        expect(mockGcsService.deleteFile).toHaveBeenCalledWith("delete.pdf");
    });

    it("should throw CustomError when protocol not found!", async () => {
        mockedProtocol.findById.mockResolvedValue(null);

        await expect(
            protocolService.removeAndRemoveFromGCS("id1")
        ).rejects.toThrow(CustomError);
        expect(gcsService.deleteFile).not.toHaveBeenCalled();
    });
});

describe("protocolService/getById", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should return the protocol by ID ", async () => {
        const mockNote: Partial<MockProtocolInterface> = {
            _id: "id1",
            title: "Title",
            date: "2024/01/01",
            fileUrl: "https://example.com/file.pdf",
            createdAt: new Date("2024-01-01"),
        };

        mockedProtocol.findById.mockResolvedValue(
            mockNote as MockProtocolInterface
        );

        const result = await protocolService.getById("id1");

        const expected: ProtocolResponseType = {
            _id: "id1",
            title: "Title",
            date: "2024/01/01",
            fileUrl: "https://example.com/file.pdf",
            createdAt: new Date("2024-01-01"),
        };

        expect(result).toEqual(expected);
        expect(mockedProtocol.findById).toHaveBeenCalledWith("id1");
    });

    it("should throw CustomError when protocol is not found", async () => {
        mockedProtocol.findById.mockResolvedValue(null);

        await expect(protocolService.getById("id1")).rejects.toThrow(
            CustomError
        );
    });
});
