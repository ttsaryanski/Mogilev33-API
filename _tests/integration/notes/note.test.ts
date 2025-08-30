// import request from "supertest";
// import mongoose from "mongoose";

// import app from "../../../src/app";
// import { Note, INote } from "../../../src/models/Note.js";

// import { CreateNoteDataType } from "../../../src/validators/notes/note.schema.js";

// describe("GET /notes", () => {
//     it("should return empty array", async () => {
//         const res = await request(app).get("/api/notes");

//         expect(res.status).toBe(200);
//         expect(Array.isArray(res.body)).toBe(true);
//         expect(res.body.length).toBe(0);
//     });

//     it("should return all existing notes", async () => {
//         await Note.create([
//             {
//                 title: "Title 1",
//                 content: "Content 1",
//             },
//             {
//                 title: "Title 2",
//                 content: "Content 2",
//             },
//         ] as INote[]);

//         const res = await request(app).get("/api/notes");

//         expect(res.status).toBe(200);
//         expect(res.body.length).toBe(2);
//         expect(res.body[0]).toHaveProperty("title");
//         expect(res.body[0]).toHaveProperty("content");
//     });
// });

// describe("POST /notes", () => {
//     beforeEach(async () => {
//         await Note.deleteMany();
//     });

//     it("should create new note and return 201", async () => {
//         const createData: CreateNoteDataType = {
//             title: "Test title",
//             content: "Test content",
//         };

//         const res = await request(app).post("/api/notes").send(createData);

//         expect(res.status).toBe(201);
//         expect(res.body.title).toBe("Test title");

//         const dbEntry = await Note.findOne({ title: "Test title" });
//         expect(dbEntry).not.toBeNull();
//     });

//     it("should return 400 if data is incorrect - title", async () => {
//         const incorrectNoteTitle: CreateNoteDataType = {
//             title: "T",
//             content: "Test content",
//         };

//         const res = await request(app)
//             .post("/api/notes")
//             .send(incorrectNoteTitle);

//         expect(res.status).toBe(400);
//         expect(res.body.message).toBe(
//             "Note title should be at least 3 characters long!"
//         );

//         const dbEntry = await Note.findOne({ title: "T" });
//         expect(dbEntry).toBeNull();
//     });

//     it("should return 400 if data is incorrect - content", async () => {
//         const incorrectNoteContent: CreateNoteDataType = {
//             title: "Test title",
//             content: "T",
//         };

//         const res = await request(app)
//             .post("/api/notes")
//             .send(incorrectNoteContent);

//         expect(res.status).toBe(400);
//         expect(res.body.message).toBe(
//             "Note content should be at least 3 characters long!"
//         );

//         const dbEntry = await Note.findOne({ title: "Test title" });
//         expect(dbEntry).toBeNull();
//     });
// });

// describe("PUT /notes/:noteId", () => {
//     let note: INote;
//     beforeEach(async () => {
//         await Note.deleteMany();

//         note = (await Note.create({
//             title: "Note title",
//             content: "Note content",
//         })) as INote;
//     });

//     const editedData: CreateNoteDataType = {
//         title: "Edited title",
//         content: "Edited content",
//     };

//     const fakeData = {
//         title: "T",
//         content: "C",
//     };

//     it("should edit note by id", async () => {
//         const res = await request(app)
//             .put(`/api/notes/${note._id}`)
//             .send(editedData);

//         expect(res.status).toBe(200);
//         expect(res.body.title).toBe("Edited title");
//     });

//     it("should return 400 if noteId is invalid", async () => {
//         const res = await request(app)
//             .put("/api/notes/invalidId")
//             .send(editedData);

//         expect(res.status).toBe(400);
//         expect(res.body.message).toBe(
//             "Id must be a valid MongooseDB ObjectId!"
//         );
//     });

//     it("should return 400 if invalid data", async () => {
//         const res = await request(app)
//             .put(`/api/notes/${note._id}`)
//             .send(fakeData);

//         expect(res.status).toBe(400);
//         expect(res.body.message).toBeDefined();
//     });

//     it("should return 404 if note not found!", async () => {
//         const nonExistingId = new mongoose.Types.ObjectId();

//         const res = await request(app)
//             .put(`/api/notes/${nonExistingId}`)
//             .send(editedData);

//         expect(res.status).toBe(404);
//         expect(res.body.message).toBe("Note not found!");
//     });
// });

// describe("DELETE /notes/:noteId", () => {
//     let note: INote;
//     beforeEach(async () => {
//         await Note.deleteMany();

//         note = (await Note.create({
//             title: "Note title",
//             content: "Note content",
//         })) as INote;
//     });

//     it("should remove note by id", async () => {
//         const res = await request(app).delete(`/api/notes/${note._id}`);

//         expect(res.status).toBe(204);

//         const dbEntry = await Note.findOne({ title: "Note title" });
//         expect(dbEntry).toBeNull();
//     });

//     it("should return 400 if noteId is invalid", async () => {
//         const res = await request(app).delete("/api/notes/invalidId");

//         expect(res.status).toBe(400);
//         expect(res.body.message).toBe(
//             "Id must be a valid MongooseDB ObjectId!"
//         );

//         const dbEntry = await Note.findOne({ title: "Note title" });
//         expect(dbEntry).not.toBeNull();
//     });

//     it("should return 404 if note not found!", async () => {
//         const nonExistingId = new mongoose.Types.ObjectId();

//         const res = await request(app).delete(`/api/notes/${nonExistingId}`);

//         expect(res.status).toBe(404);
//         expect(res.body.message).toBe("Note not found!");

//         const dbEntry = await Note.findOne({ title: "Note title" });
//         expect(dbEntry).not.toBeNull();
//     });
// });

// describe("GET /notes/:noteId", () => {
//     let note: INote;
//     beforeEach(async () => {
//         await Note.deleteMany();

//         note = (await Note.create({
//             title: "Note title",
//             content: "Note content",
//         })) as INote;
//     });

//     it("should return one note by id", async () => {
//         const res = await request(app).get(`/api/notes/${note._id}`);
//         console.log(res.body);

//         expect(res.status).toBe(200);
//         expect(res.body.title).toBe("Note title");
//         expect(res.body).toHaveProperty("_id", String(note._id));
//     });

//     it("should return 400 if noteId is invalid", async () => {
//         const res = await request(app).get("/api/notes/invalidId");

//         expect(res.status).toBe(400);
//         expect(res.body.message).toBe(
//             "Id must be a valid MongooseDB ObjectId!"
//         );
//     });

//     it("should return 404 if note not found!", async () => {
//         const nonExistingId = new mongoose.Types.ObjectId();

//         const res = await request(app).get(`/api/notes/${nonExistingId}`);

//         expect(res.status).toBe(404);
//         expect(res.body.message).toBe("There is no note with this id!");
//     });
// });
