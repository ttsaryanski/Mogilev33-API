export interface ErrorTypes extends Error {
    status?: number;
    statusCode?: number;
}
