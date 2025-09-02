import { Type } from "js-yaml";
import { JwtPayload } from "jsonwebtoken";

export type RequestUser = { _id: string; email: string; role: string };

declare global {
    namespace Express {
        interface Request {
            user?: RequestUser;
            isAuthenticated?: boolean;
        }
    }
}
