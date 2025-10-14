import { gcsService } from "../../../src/services/gcsService.js";

import { uploadFileToGCS } from "../../../src/utils/upload/gcsUpload.js";
import { deleteFileFromGCS } from "../../../src/utils/upload/gcsDelete.js";

jest.mock("../../../src/utils/upload/gcsUpload.js", () => ({
    uploadFileToGCS: jest.fn(),
}));
jest.mock("../../../src/utils/upload/gcsDelete.js", () => ({
    deleteFileFromGCS: jest.fn(),
}));

const mockFile = {
    originalname: "test.pdf",
    mimetype: "application/pdf",
    buffer: Buffer.from("test"),
    size: 1234,
} as Express.Multer.File;

describe("gcsService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("uploadFile()", () => {
        it("should call uploadFileToGCS and return the uploaded file URL", async () => {
            const mockUrl =
                "https://storage.googleapis.com/test-bucket/test.pdf";
            (uploadFileToGCS as jest.Mock).mockResolvedValue(mockUrl);

            const result = await gcsService.uploadFile(mockFile);

            expect(uploadFileToGCS).toHaveBeenCalledTimes(1);
            expect(uploadFileToGCS).toHaveBeenCalledWith(mockFile);
            expect(result).toBe(mockUrl);
        });

        it("should propagate errors from uploadFileToGCS", async () => {
            (uploadFileToGCS as jest.Mock).mockRejectedValue(
                new Error("Upload failed")
            );

            await expect(gcsService.uploadFile(mockFile)).rejects.toThrow(
                "Upload failed"
            );
        });
    });

    describe("deleteFile()", () => {
        it("should call deleteFileFromGCS with correct path", async () => {
            (deleteFileFromGCS as jest.Mock).mockResolvedValue(undefined);

            await gcsService.deleteFile("test.pdf");

            expect(deleteFileFromGCS).toHaveBeenCalledTimes(1);
            expect(deleteFileFromGCS).toHaveBeenCalledWith("test.pdf");
        });

        it("should propagate errors from deleteFileFromGCS", async () => {
            (deleteFileFromGCS as jest.Mock).mockRejectedValue(
                new Error("Delete failed")
            );

            await expect(gcsService.deleteFile("test.pdf")).rejects.toThrow(
                "Delete failed"
            );
        });
    });
});
