import { connectTestDB, clearTestDB, disconnectTestDB } from "./mongo_setup.js";

beforeAll(async () => {
    await connectTestDB();
});

afterAll(async () => {
    await disconnectTestDB();
});

beforeEach(async () => {
    await clearTestDB();
});
