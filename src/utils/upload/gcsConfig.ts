import { Storage } from "@google-cloud/storage";
import { config } from "dotenv";
config();

import { CustomError } from "../errorUtils/customError.js";

const bucketName = process.env.GCS_BUCKET_NAME;

if (!bucketName) {
    throw new CustomError(
        "GCS_BUCKET_NAME environment variable is required",
        500
    );
}

const storage = new Storage();
const bucket = storage.bucket(bucketName);

export default bucket;
