import multer from "multer";

import { uploadConfig } from "./uploadConfig.js";
import { CustomError } from "../errorUtils/customError.js";

const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (
    req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    if (uploadConfig.allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new CustomError("Only PDF files are allowed!", 400));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: uploadConfig.maxFileSize,
        files: 1,
    },
});

export default upload;
