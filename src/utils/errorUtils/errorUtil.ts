import { Error as MongooseError, mongo } from "mongoose";

import { ErrorTypes } from "../../types/ErrorTypes.js";

type MongoDuplicateError = mongo.MongoServerError & {
    code: 11000;
    keyValue: Record<string, string>;
};

type CustomError = {
    name?: string;
    message?: string;
    status?: number;
    statusCode?: number;
};

export const createErrorMsg = (
    err:
        | MongooseError.ValidationError
        | MongooseError.CastError
        | MongoDuplicateError
        | SyntaxError
        | CustomError
        | null
        | undefined
): string => {
    if (!err) return "Unknown error!";

    if (err?.name === "ValidationError") {
        return Object.values((err as MongooseError.ValidationError).errors)
            .map((e) => e.message)
            .join(", ");
    }

    if (err?.name === "CastError") {
        return "Missing or invalid data!";
    }

    if (
        err?.name === "MongoServerError" &&
        (err as MongoDuplicateError).code === 11000
    ) {
        const field = Object.keys((err as MongoDuplicateError).keyValue)[0];
        return `Duplicate ${field}: "${(err as MongoDuplicateError).keyValue[field]}" already exists!`;
    }

    if (err?.name === "CustomError" && err.message) {
        return err.message;
    }

    if (
        err instanceof SyntaxError &&
        (err as ErrorTypes).status === 400 &&
        "body" in err
    ) {
        return "Invalid JSON input!";
    }

    return err.message || "Something went wrong!";
};
