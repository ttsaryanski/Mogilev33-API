import { offerService } from "../../../src/services/offerService.js";
import { gcsService } from "../../../src/services/gcsService.js";

import { Offer } from "../../../src/models/Offer.js";

import { OfferResponseType } from "../../../src/types/OfferTypes.js";
import {
    CreateOfferDataType,
    CreateOfferWithUploadDataType,
} from "../../../src/validators/offer.schema.js";

import { CustomError } from "../../../src/utils/errorUtils/customError.js";

interface MockOfferInterface {
    _id: string;
    title: string;
    company: string;
    price: number;
    fileUrl: string;
    createdAt: Date;
}
type OfferModelType = typeof Offer;
const mockedOffer = Offer as jest.Mocked<OfferModelType>;

jest.mock("../../../src/models/Offer.js", () => ({
    Offer: {
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

describe("offerService/getAll()", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return array from all offers", async () => {
        const mockData: Partial<MockOfferInterface>[] = [
            {
                _id: "id1",
                title: "Title 1",
                company: "Company 1",
                price: 100,
                fileUrl: "https://example.com/file1.pdf",
                createdAt: new Date("2024-01-01"),
            },
            {
                _id: "id2",
                title: "Title 2",
                company: "Company 2",
                price: 200,
                fileUrl: "https://example.com/file2.pdf",
                createdAt: new Date("2024-01-02"),
            },
        ];
        const leanMock = jest.fn().mockResolvedValue(mockData);
        const selectMock = jest.fn().mockReturnValue({ lean: leanMock });
        (mockedOffer.find as jest.Mock).mockReturnValue({
            select: selectMock,
        });

        const result = await offerService.getAll();

        const expected: OfferResponseType[] = [
            {
                _id: "id1",
                title: "Title 1",
                company: "Company 1",
                price: 100,
                fileUrl: "https://example.com/file1.pdf",
                createdAt: new Date("2024-01-01"),
            },
            {
                _id: "id2",
                title: "Title 2",
                company: "Company 2",
                price: 200,
                fileUrl: "https://example.com/file2.pdf",
                createdAt: new Date("2024-01-02"),
            },
        ];

        expect(result).toEqual(expected);
        expect(mockedOffer.find).toHaveBeenCalled();
        expect(mockedOffer.find).toHaveBeenCalledTimes(1);
        expect(selectMock).toHaveBeenCalledWith("-__v");
        expect(leanMock).toHaveBeenCalledTimes(1);
    });
});

describe("offerService/create", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should create and return new offer", async () => {
        const createData: CreateOfferDataType = {
            title: "Test title",
            company: "Test company",
            price: 150,
            fileUrl: "https://example.com/offer.pdf",
        };

        const mockOffer: Partial<MockOfferInterface> = {
            _id: "id1",
            title: "Test title",
            company: "Test company",
            price: 150,
            fileUrl: "https://example.com/offer.pdf",
            createdAt: new Date("2024-01-01"),
        };
        (mockedOffer.create as jest.Mock).mockResolvedValue(mockOffer);

        const result = await offerService.create(createData);

        const expected: OfferResponseType = {
            _id: "id1",
            title: "Test title",
            company: "Test company",
            price: 150,
            fileUrl: "https://example.com/offer.pdf",
            createdAt: new Date("2024-01-01"),
        };

        expect(result).toEqual(expected);
        expect(mockedOffer.create).toHaveBeenCalledWith(createData);
    });
});

describe("offerService/createWithFile", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create and return new offer", async () => {
        const createData: CreateOfferWithUploadDataType = {
            title: "Test title",
            company: "Test company",
            price: 150,
            file: mockFile,
        };
        const mockOffer: Partial<MockOfferInterface> = {
            _id: "id1",
            title: "Test title",
            company: "Test company",
            price: 150,
            fileUrl: "https://storage.fake/test.pdf",
            createdAt: new Date("2024-01-01"),
        };
        mockGcsService.uploadFile.mockResolvedValue(
            "https://storage.fake/test.pdf"
        );
        (mockedOffer.create as jest.Mock).mockResolvedValue(mockOffer);

        const result = await offerService.createWithFile(createData, mockFile);

        const expected: OfferResponseType = {
            _id: "id1",
            title: "Test title",
            company: "Test company",
            price: 150,
            fileUrl: "https://storage.fake/test.pdf",
            createdAt: new Date("2024-01-01"),
        };

        expect(result).toEqual(expected);
        expect(mockedOffer.create).toHaveBeenCalledWith({
            ...createData,
            fileUrl: "https://storage.fake/test.pdf",
        });
        expect(mockGcsService.uploadFile).toHaveBeenCalledWith(mockFile);
    });
});

describe("offerService/edit", () => {
    it("should update and return the updated offer", async () => {
        const offerId = "id1";
        const updateData: CreateOfferDataType = {
            title: "Updated title",
            company: "Updated company",
            price: 250,
            fileUrl: "https://example.com/updated.pdf",
        };
        const mockUpdate: Partial<MockOfferInterface> = {
            _id: offerId,
            ...updateData,
            createdAt: new Date("2024-01-01"),
        };

        mockedOffer.findByIdAndUpdate.mockResolvedValue(
            mockUpdate as MockOfferInterface
        );

        const result = await offerService.edit(offerId, updateData);

        const expected: OfferResponseType = {
            _id: offerId,
            title: "Updated title",
            company: "Updated company",
            price: 250,
            fileUrl: "https://example.com/updated.pdf",
            createdAt: new Date("2024-01-01"),
        };

        expect(mockedOffer.findByIdAndUpdate).toHaveBeenCalledWith(
            offerId,
            updateData,
            {
                runValidators: true,
                new: true,
            }
        );
        expect(result).toEqual(expected);
    });

    it("should throw CustomError if no offer is found to update", async () => {
        mockedOffer.findByIdAndUpdate.mockResolvedValue(null);

        await expect(
            offerService.edit("id1", {
                title: "x",
                company: "y",
                price: 50,
                fileUrl: "z",
            })
        ).rejects.toThrow(CustomError);
    });
});

describe("offerService/editWithFile", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.GCS_BUCKET_NAME = "test-bucket";
    });

    it("should update and return the updated offer", async () => {
        const offerId = "id1";
        const updateData: CreateOfferWithUploadDataType = {
            title: "Updated title",
            company: "Updated company",
            price: 250,
            file: mockFile,
        };

        const oldOffer = {
            _id: offerId,
            title: "Old title",
            company: "Old company",
            price: 150,
            fileUrl: `https://storage.googleapis.com/${bucket}/old.pdf`,
            createdAt: new Date("2024-01-01"),
        };
        (mockedOffer.findById as jest.Mock).mockResolvedValue(oldOffer);
        const mockUpdate: Partial<MockOfferInterface> = {
            _id: offerId,
            title: "Updated title",
            company: "Updated company",
            price: 250,
            fileUrl: `https://storage.googleapis.com/${bucket}/test.pdf`,
            createdAt: new Date("2024-01-01"),
        };
        (mockedOffer.findByIdAndUpdate as jest.Mock).mockResolvedValue(
            mockUpdate
        );
        mockGcsService.deleteFile.mockResolvedValue();
        mockGcsService.uploadFile.mockResolvedValue(
            `https://storage.googleapis.com/${bucket}/test.pdf`
        );

        const result = await offerService.editWithFile(
            offerId,
            updateData,
            mockFile
        );

        const expected: OfferResponseType = {
            _id: offerId,
            title: "Updated title",
            company: "Updated company",
            price: 250,
            fileUrl: `https://storage.googleapis.com/${bucket}/test.pdf`,
            createdAt: new Date("2024-01-01"),
        };

        expect(Offer.findById).toHaveBeenCalledWith(offerId);
        expect(result).toEqual(expected);
        expect(result._id).toBe(offerId);
        expect(mockedOffer.findByIdAndUpdate).toHaveBeenCalledWith(
            offerId,
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

    it("should throw CustomError if no offer is found to update", async () => {
        mockedOffer.findById.mockResolvedValue(null);

        await expect(
            offerService.editWithFile(
                "id1",
                {
                    title: "x",
                    company: "y",
                    price: 50,
                    file: mockFile,
                },
                mockFile
            )
        ).rejects.toThrow(CustomError);
        expect(gcsService.deleteFile).not.toHaveBeenCalled();
        expect(gcsService.uploadFile).not.toHaveBeenCalled();
    });
});

describe("offerService/remove", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should delete a offer", async () => {
        const mockDelete: Partial<MockOfferInterface> = {
            _id: "id1",
            title: "to delete",
            company: "Company",
            price: 100,
            fileUrl: "https://example.com/delete.pdf",
            createdAt: new Date("2024-01-01"),
        };
        mockedOffer.findByIdAndDelete.mockResolvedValue(
            mockDelete as MockOfferInterface
        );

        await offerService.remove("id1");

        expect(mockedOffer.findByIdAndDelete).toHaveBeenCalledWith("id1");
    });

    it("should throw CustomError when offer not found!", async () => {
        mockedOffer.findByIdAndDelete.mockResolvedValue(null);

        await expect(offerService.remove("id1")).rejects.toThrow(CustomError);
    });
});

describe("offerService/removeAndRemoveFromGCS", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.GCS_BUCKET_NAME = "test-bucket";
    });

    it("should delete a offer", async () => {
        const mockDelete: Partial<MockOfferInterface> = {
            _id: "id1",
            title: "to delete",
            company: "to delete company",
            price: 100,
            fileUrl: `https://storage.googleapis.com/${bucket}/delete.pdf`,
            createdAt: new Date("2024-01-01"),
        };
        (mockedOffer.findById as jest.Mock).mockResolvedValue(mockDelete);
        mockGcsService.deleteFile.mockResolvedValue();
        mockedOffer.findByIdAndDelete.mockResolvedValue(
            mockDelete as MockOfferInterface
        );

        await offerService.removeAndRemoveFromGCS("id1");

        expect(mockedOffer.findByIdAndDelete).toHaveBeenCalledWith("id1");
        expect(mockGcsService.deleteFile).toHaveBeenCalledWith("delete.pdf");
    });

    it("should throw CustomError when offer not found!", async () => {
        mockedOffer.findById.mockResolvedValue(null);

        await expect(
            offerService.removeAndRemoveFromGCS("id1")
        ).rejects.toThrow(CustomError);
        expect(gcsService.deleteFile).not.toHaveBeenCalled();
    });
});

describe("offerService/getById", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should return the offer by ID ", async () => {
        const mockNote: Partial<MockOfferInterface> = {
            _id: "id1",
            title: "Title",
            company: "Company",
            price: 100,
            fileUrl: "https://example.com/file.pdf",
            createdAt: new Date("2024-01-01"),
        };

        mockedOffer.findById.mockResolvedValue(mockNote as MockOfferInterface);

        const result = await offerService.getById("id1");

        const expected: OfferResponseType = {
            _id: "id1",
            title: "Title",
            company: "Company",
            price: 100,
            fileUrl: "https://example.com/file.pdf",
            createdAt: new Date("2024-01-01"),
        };

        expect(result).toEqual(expected);
        expect(mockedOffer.findById).toHaveBeenCalledWith("id1");
    });

    it("should throw CustomError when offer is not found", async () => {
        mockedOffer.findById.mockResolvedValue(null);

        await expect(offerService.getById("id1")).rejects.toThrow(CustomError);
    });
});
