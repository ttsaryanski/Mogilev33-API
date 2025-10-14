import { inviteService } from "../../../src/services/inviteService.js";
import { gcsService } from "../../../src/services/gcsService.js";

import { Invite } from "../../../src/models/Invite.js";

import { InviteResponseType } from "../../../src/types/InviteTypes.js";
import {
    CreateInviteDataType,
    CreateInviteWithUploadDataType,
} from "../../../src/validators/invite.schema.js";

import { CustomError } from "../../../src/utils/errorUtils/customError.js";

interface MockInviteInterface {
    _id: string;
    title: string;
    date: string;
    fileUrl: string;
    createdAt: Date;
}
type InviteModelType = typeof Invite;
const mockedInvite = Invite as jest.Mocked<InviteModelType>;

jest.mock("../../../src/models/Invite.js", () => ({
    Invite: {
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

describe("inviteService/getAll()", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return array from all invites", async () => {
        const mockData: Partial<MockInviteInterface>[] = [
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
        (mockedInvite.find as jest.Mock).mockReturnValue({
            select: selectMock,
        });

        const result = await inviteService.getAll();

        const expected: InviteResponseType[] = [
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
        expect(mockedInvite.find).toHaveBeenCalled();
        expect(mockedInvite.find).toHaveBeenCalledTimes(1);
        expect(selectMock).toHaveBeenCalledWith("-__v");
        expect(leanMock).toHaveBeenCalledTimes(1);
    });
});

describe("inviteService/create", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create and return new invite", async () => {
        const createData: CreateInviteDataType = {
            title: "Test title",
            date: "2024/12/31",
            fileUrl: "https://example.com/invite.pdf",
        };

        const mockInvite: Partial<MockInviteInterface> = {
            _id: "id1",
            title: "Test title",
            date: "2024/12/31",
            fileUrl: "https://example.com/invite.pdf",
            createdAt: new Date("2024-01-01"),
        };

        (mockedInvite.create as jest.Mock).mockResolvedValue(mockInvite);

        const result = await inviteService.create(createData);

        const expected: InviteResponseType = {
            _id: "id1",
            title: "Test title",
            date: "2024/12/31",
            fileUrl: "https://example.com/invite.pdf",
            createdAt: new Date("2024-01-01"),
        };

        expect(result).toEqual(expected);
        expect(mockedInvite.create).toHaveBeenCalledWith(createData);
    });
});

describe("inviteService/createWithFile", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create and return new invite", async () => {
        const createData: CreateInviteWithUploadDataType = {
            title: "Test title",
            date: "2024/12/31",
            file: mockFile,
        };
        const mockInvite: Partial<MockInviteInterface> = {
            _id: "id1",
            title: "Test title",
            date: "2024/12/31",
            fileUrl: "https://storage.fake/test.pdf",
            createdAt: new Date("2024-01-01"),
        };
        mockGcsService.uploadFile.mockResolvedValue(
            "https://storage.fake/test.pdf"
        );
        (mockedInvite.create as jest.Mock).mockResolvedValue(mockInvite);

        const result = await inviteService.createWithFile(createData, mockFile);

        const expected: InviteResponseType = {
            _id: "id1",
            title: "Test title",
            date: "2024/12/31",
            fileUrl: "https://storage.fake/test.pdf",
            createdAt: new Date("2024-01-01"),
        };

        expect(result).toEqual(expected);
        expect(mockedInvite.create).toHaveBeenCalledWith({
            ...createData,
            fileUrl: "https://storage.fake/test.pdf",
        });
        expect(mockGcsService.uploadFile).toHaveBeenCalledWith(mockFile);
    });
});

describe("inviteService/edit", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should update and return the updated invite", async () => {
        const inviteId = "id1";
        const updateData: CreateInviteDataType = {
            title: "Updated title",
            date: "2024/11/30",
            fileUrl: "https://example.com/updated.pdf",
        };
        const mockUpdate: Partial<MockInviteInterface> = {
            _id: inviteId,
            ...updateData,
            createdAt: new Date("2024-01-01"),
        };

        mockedInvite.findByIdAndUpdate.mockResolvedValue(
            mockUpdate as MockInviteInterface
        );

        const result = await inviteService.edit(inviteId, updateData);

        const expected: InviteResponseType = {
            _id: inviteId,
            title: "Updated title",
            date: "2024/11/30",
            fileUrl: "https://example.com/updated.pdf",
            createdAt: new Date("2024-01-01"),
        };

        expect(mockedInvite.findByIdAndUpdate).toHaveBeenCalledWith(
            inviteId,
            updateData,
            {
                runValidators: true,
                new: true,
            }
        );
        expect(result).toEqual(expected);
        expect(result._id).toBe(inviteId);
    });

    it("should throw CustomError if no invite is found to update", async () => {
        mockedInvite.findByIdAndUpdate.mockResolvedValue(null);

        await expect(
            inviteService.edit("id1", { title: "x", date: "y", fileUrl: "z" })
        ).rejects.toThrow(CustomError);
    });
});

describe("inviteService/editWithFile", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.GCS_BUCKET_NAME = "test-bucket";
    });

    it("should update and return the updated invite", async () => {
        const inviteId = "id1";
        const updateData: CreateInviteWithUploadDataType = {
            title: "Updated title",
            date: "2025/12/31",
            file: mockFile,
        };

        const oldInvite = {
            _id: inviteId,
            title: "Old title",
            date: "2024/01/01",
            fileUrl: `https://storage.googleapis.com/${bucket}/old.pdf`,
            createdAt: new Date("2024-01-01"),
        };
        (mockedInvite.findById as jest.Mock).mockResolvedValue(oldInvite);
        const mockUpdate: Partial<MockInviteInterface> = {
            _id: inviteId,
            title: "Updated title",
            date: "2025/12/31",
            fileUrl: `https://storage.googleapis.com/${bucket}/test.pdf`,
            createdAt: new Date("2024-01-01"),
        };
        (mockedInvite.findByIdAndUpdate as jest.Mock).mockResolvedValue(
            mockUpdate
        );
        mockGcsService.deleteFile.mockResolvedValue();
        mockGcsService.uploadFile.mockResolvedValue(
            `https://storage.googleapis.com/${bucket}/test.pdf`
        );

        const result = await inviteService.editWithFile(
            inviteId,
            updateData,
            mockFile
        );

        const expected: InviteResponseType = {
            _id: inviteId,
            title: "Updated title",
            date: "2025/12/31",
            fileUrl: `https://storage.googleapis.com/${bucket}/test.pdf`,
            createdAt: new Date("2024-01-01"),
        };

        expect(Invite.findById).toHaveBeenCalledWith(inviteId);
        expect(result).toEqual(expected);
        expect(result._id).toBe(inviteId);
        expect(mockedInvite.findByIdAndUpdate).toHaveBeenCalledWith(
            inviteId,
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

    it("should throw CustomError if no invite is found to update", async () => {
        mockedInvite.findById.mockResolvedValue(null);

        await expect(
            inviteService.editWithFile(
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

describe("inviteService/remove", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should delete a invite", async () => {
        const mockDelete: Partial<MockInviteInterface> = {
            _id: "id1",
            title: "to delete",
            date: "2024/10/10",
            fileUrl: "https://example.com/delete.pdf",
            createdAt: new Date("2024-01-01"),
        };
        mockedInvite.findByIdAndDelete.mockResolvedValue(
            mockDelete as MockInviteInterface
        );

        await inviteService.remove("id1");

        expect(mockedInvite.findByIdAndDelete).toHaveBeenCalledWith("id1");
    });

    it("should throw CustomError when invite not found!", async () => {
        mockedInvite.findByIdAndDelete.mockResolvedValue(null);

        await expect(inviteService.remove("id1")).rejects.toThrow(CustomError);
    });
});

describe("inviteService/removeAndRemoveFromGCS", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.GCS_BUCKET_NAME = "test-bucket";
    });

    it("should delete a invite", async () => {
        const mockDelete: Partial<MockInviteInterface> = {
            _id: "id1",
            title: "to delete",
            date: "2024/10/10",
            fileUrl: `https://storage.googleapis.com/${bucket}/delete.pdf`,
            createdAt: new Date("2024-01-01"),
        };
        (mockedInvite.findById as jest.Mock).mockResolvedValue(mockDelete);
        mockGcsService.deleteFile.mockResolvedValue();
        mockedInvite.findByIdAndDelete.mockResolvedValue(
            mockDelete as MockInviteInterface
        );

        await inviteService.removeAndRemoveFromGCS("id1");

        expect(mockedInvite.findByIdAndDelete).toHaveBeenCalledWith("id1");
        expect(mockGcsService.deleteFile).toHaveBeenCalledWith("delete.pdf");
    });

    it("should throw CustomError when invite not found!", async () => {
        mockedInvite.findById.mockResolvedValue(null);

        await expect(
            inviteService.removeAndRemoveFromGCS("id1")
        ).rejects.toThrow(CustomError);
        expect(gcsService.deleteFile).not.toHaveBeenCalled();
    });
});

describe("inviteService/getById", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return the invite by ID ", async () => {
        const mockNote: Partial<MockInviteInterface> = {
            _id: "id1",
            title: "Title",
            date: "2024/01/01",
            fileUrl: "https://example.com/file.pdf",
            createdAt: new Date("2024-01-01"),
        };

        mockedInvite.findById.mockResolvedValue(
            mockNote as MockInviteInterface
        );

        const result = await inviteService.getById("id1");

        const expected: InviteResponseType = {
            _id: "id1",
            title: "Title",
            date: "2024/01/01",
            fileUrl: "https://example.com/file.pdf",
            createdAt: new Date("2024-01-01"),
        };

        expect(result).toEqual(expected);
        expect(mockedInvite.findById).toHaveBeenCalledWith("id1");
    });

    it("should throw CustomError when invite is not found", async () => {
        mockedInvite.findById.mockResolvedValue(null);

        await expect(inviteService.getById("id1")).rejects.toThrow(CustomError);
    });
});
