import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongo: MongoMemoryServer | null = null;

export async function connectTestDB() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }

    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri);
}

export async function clearTestDB() {
    const db = mongoose.connection.db;
    if (!db) {
        throw new Error("Database connection is not established.");
    }

    const collections = await db.collections();

    for (const collection of collections) {
        await collection.deleteMany();
    }
}

export async function disconnectTestDB() {
    await mongoose.disconnect();
    if (mongo) {
        await mongo.stop();
    }
}
