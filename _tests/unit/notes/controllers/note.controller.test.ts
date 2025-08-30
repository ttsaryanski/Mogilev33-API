// import express from "express";
// import request from "supertest";

// import { noteController } from "../../../../src/controllers/noteController.js";

// import errorHandler from "../../../../src/middlewares/errorHandler.js";

// import { NoteServicesTypes } from "../../../../src/types/ServicesTypes.js";
// import { NoteResponseType } from "../../../../src/types/NoteTypes.js";
// import { CreateNoteDataType } from "../../../../src/validators/notes/note.schema.js";

// const validId = "64b2f9d4f8a1e4e1c5a9c123";

// const mockNotesService: jest.Mocked<NoteServicesTypes> = {
//     getAll: jest.fn(),
//     create: jest.fn(),
//     edit: jest.fn(),
//     remove: jest.fn(),
//     getById: jest.fn(),
// };

// const app = express();
// app.use(express.json());
// app.use("/notes", noteController(mockNotesService));
// app.use(errorHandler);

// describe("Notes Controller", () => {
//     beforeEach(() => {
//         jest.clearAllMocks();
//     });

//     test("GET /notes - should return all notes", async () => {
//         const mockData = [
//             {
//                 title: "New note",
//                 content: "Note content",
//                 _id: validId,
//                 createdAt: new Date(),
//             },
//         ];
//         mockNotesService.getAll.mockResolvedValue(mockData);

//         const res = await request(app).get("/notes");
//         const resBody = res.body as NoteResponseType[];

//         expect(res.status).toBe(200);
//         expect([
//             {
//                 ...resBody[0],
//                 createdAt: new Date(resBody[0].createdAt),
//             },
//         ]).toEqual(mockData);
//     });

//     test("GET /notes - should return 500 on service error", async () => {
//         mockNotesService.getAll.mockRejectedValue(
//             new Error("Service failure!")
//         );

//         const res = await request(app).get("/notes");

//         expect(res.status).toBe(500);
//         expect(res.body.message).toMatch("Service failure!");
//     });

//     test("POST /notes - should create a note", async () => {
//         const newNote: CreateNoteDataType = {
//             title: "New note",
//             content: "Note content",
//         };
//         const createdNote: NoteResponseType = {
//             ...newNote,
//             _id: validId,
//             createdAt: new Date(),
//         };
//         mockNotesService.create.mockResolvedValue(createdNote);

//         const res = await request(app).post("/notes").send(newNote);
//         const resBody = res.body as NoteResponseType;

//         expect(res.status).toBe(201);
//         expect({
//             ...resBody,
//             createdAt: new Date(resBody.createdAt),
//         }).toEqual(createdNote);
//         expect(mockNotesService.create).toHaveBeenCalledWith(newNote);
//     });

//     test("POST /notes - should return 400 for invalid data title", async () => {
//         const invalidData = {
//             title: "T",
//             content: "Valid content",
//         };

//         const res = await request(app).post("/notes").send(invalidData);

//         expect(res.status).toBe(400);
//         expect(res.body.message).toBe(
//             "Note title should be at least 3 characters long!"
//         );
//     });

//     test("POST /notes - should return 400 for invalid data content", async () => {
//         const invalidData = {
//             title: "Valid title",
//             content: "C",
//         };

//         const res = await request(app).post("/notes").send(invalidData);

//         expect(res.status).toBe(400);
//         expect(res.body.message).toBe(
//             "Note content should be at least 3 characters long!"
//         );
//     });

//     test("PUT /notes/:noteId - should edit note", async () => {
//         const editData: CreateNoteDataType = {
//             title: "Edited note title",
//             content: "Edited note content",
//         };
//         const updatedNote: NoteResponseType = {
//             ...editData,
//             _id: validId,
//             createdAt: new Date(),
//         };
//         mockNotesService.edit.mockResolvedValue(updatedNote);

//         const res = await request(app).put(`/notes/${validId}`).send(editData);
//         const resBody = res.body as NoteResponseType;

//         expect(res.status).toBe(200);
//         expect({
//             ...resBody,
//             createdAt: new Date(resBody.createdAt),
//         }).toEqual(updatedNote);
//         expect(mockNotesService.edit).toHaveBeenCalledWith(validId, editData);
//     });

//     test("PUT /notes/:noteId - should return 400 for invalid update data title", async () => {
//         const invalidData: CreateNoteDataType = {
//             title: "T",
//             content: "Valid content",
//         };

//         const res = await request(app)
//             .put(`/notes/${validId}`)
//             .send(invalidData);

//         expect(res.status).toBe(400);
//         expect(res.body.message).toBe(
//             "Note title should be at least 3 characters long!"
//         );
//     });

//     test("PUT /notes/:noteId - should return 400 for invalid update data content", async () => {
//         const invalidData: CreateNoteDataType = {
//             title: "Valid title",
//             content: "C",
//         };

//         const res = await request(app)
//             .put(`/notes/${validId}`)
//             .send(invalidData);

//         expect(res.status).toBe(400);
//         expect(res.body.message).toBe(
//             "Note content should be at least 3 characters long!"
//         );
//     });

//     test("PUT /notes/:noteId - should return 400 for invalid note ID", async () => {
//         const validData: CreateNoteDataType = {
//             title: "Valid title",
//             content: "Valid content",
//         };

//         const res = await request(app).put("/notes/invalidId").send(validData);

//         expect(res.status).toBe(400);
//         expect(res.body.message).toBe(
//             "Id must be a valid MongooseDB ObjectId!"
//         );
//     });

//     test("DELETE /notes/:noteId - should delete note", async () => {
//         mockNotesService.remove.mockResolvedValue();

//         const res = await request(app).delete(`/notes/${validId}`);
//         const resBody = res.body as NoteResponseType;

//         expect(res.status).toBe(204);
//         expect(resBody).toEqual({});
//         expect(mockNotesService.remove).toHaveBeenCalledWith(validId);
//     });

//     test("DELETE /notes/:noteId - should return 400 for invalid note ID", async () => {
//         const res = await request(app).delete("/notes/invalidId");

//         expect(res.status).toBe(400);
//         expect(res.body.message).toBe(
//             "Id must be a valid MongooseDB ObjectId!"
//         );
//     });

//     test("GET /notes/noteId - should return note by ID", async () => {
//         const mockData = {
//             title: "New note",
//             content: "Note content",
//             _id: validId,
//             createdAt: new Date(),
//         };
//         mockNotesService.getById.mockResolvedValue(mockData);

//         const res = await request(app).get(`/notes/${validId}`);
//         const resBody = res.body as NoteResponseType;

//         expect(res.status).toBe(200);
//         expect({
//             ...resBody,
//             createdAt: new Date(resBody.createdAt),
//         }).toEqual(mockData);
//     });

//     test("GET /notes/:noteId - should return 400 for invalid note ID", async () => {
//         const res = await request(app).get("/notes/invalidId");

//         expect(res.status).toBe(400);
//         expect(res.body.message).toBe(
//             "Id must be a valid MongooseDB ObjectId!"
//         );
//     });

//     test("GET /notes/noteId - should return 500 on service error", async () => {
//         mockNotesService.getById.mockRejectedValue(
//             new Error("Service failure!")
//         );

//         const res = await request(app).get(`/notes/${validId}`);

//         expect(res.status).toBe(500);
//         expect(res.body.message).toMatch("Service failure!");
//     });
// });
