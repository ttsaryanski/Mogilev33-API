import jwt from "jsonwebtoken";

export function signJwt(
    payload: object,
    secret: string,
    options?: jwt.SignOptions
): Promise<string> {
    return new Promise((resolve, reject) => {
        jwt.sign(payload, secret, options || {}, (err, token) => {
            if (err || !token) return reject(err);
            resolve(token);
        });
    });
}

export function verifyJwt(
    token: string,
    secret: string,
    options?: jwt.VerifyOptions
): Promise<jwt.JwtPayload | string> {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secret, options || {}, (err, decoded) => {
            if (err) return reject(err);
            resolve(decoded as jwt.JwtPayload | string);
        });
    });
}
