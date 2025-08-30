// import { noteService } from "../../../../src/services/noteService.js";

// import { Note } from "../../../../src/models/Note.js";

// import { NoteResponseType } from "../../../../src/types/NoteTypes.js";
// import { CreateNoteDataType } from "../../../../src/validators/notes/note.schema.js";

// import { CustomError } from "../../../../src/utils/errorUtils/customError.js";

// interface MockNoteInterface {
//     _id: string;
//     title: string;
//     content: string;
//     createdAt: Date;
// }

// type NoteModelType = typeof Note;
// const mockedNote = Note as jest.Mocked<NoteModelType>;

// jest.mock("../../../../src/models/Note.js", () => ({
//     Note: {
//         find: jest.fn(),
//         create: jest.fn(),
//         findByIdAndUpdate: jest.fn(),
//         findByIdAndDelete: jest.fn(),
//         findById: jest.fn(),
//     },
// }));

// describe("notesService/getAll()", () => {
//     beforeEach(() => {
//         jest.clearAllMocks();
//     });

//     it("should return array from all notes", async () => {
//         const mockData: Partial<MockNoteInterface>[] = [
//             {
//                 _id: "id1",
//                 title: "Title 1",
//                 content: "Content 1",
//                 createdAt: new Date("2024-01-01"),
//             },
//             {
//                 _id: "id2",
//                 title: "Title 2",
//                 content: "Content 2",
//                 createdAt: new Date("2024-01-02"),
//             },
//         ];
//         const leanMock = jest.fn().mockResolvedValue(mockData);
//         const selectMock = jest.fn().mockReturnValue({ lean: leanMock });
//         (mockedNote.find as jest.Mock).mockReturnValue({ select: selectMock });

//         const result = await noteService.getAll();

//         const expected: NoteResponseType[] = [
//             {
//                 _id: "id1",
//                 title: "Title 1",
//                 content: "Content 1",
//                 createdAt: new Date("2024-01-01"),
//             },
//             {
//                 _id: "id2",
//                 title: "Title 2",
//                 content: "Content 2",
//                 createdAt: new Date("2024-01-02"),
//             },
//         ];

//         expect(result).toEqual(expected);
//         expect(mockedNote.find).toHaveBeenCalledTimes(1);
//         expect(selectMock).toHaveBeenCalledWith("-__v");
//         expect(leanMock).toHaveBeenCalledTimes(1);
//     });
// });

// describe("notesService/create", () => {
//     afterEach(() => {
//         jest.clearAllMocks();
//     });

//     it("should create and return new note", async () => {
//         const createData: CreateNoteDataType = {
//             title: "Test title",
//             content: "Test content",
//         };

//         const mockNote: Partial<MockNoteInterface> = {
//             _id: "id1",
//             title: "Test title",
//             content: "Test content",
//             createdAt: new Date("2024-01-01"),
//         };

//         (mockedNote.create as jest.Mock).mockResolvedValue(mockNote);

//         const result = await noteService.create(createData);

//         const expected: NoteResponseType = {
//             _id: "id1",
//             title: "Test title",
//             content: "Test content",
//             createdAt: new Date("2024-01-01"),
//         };

//         expect(result).toEqual(expected);
//         expect(mockedNote.create).toHaveBeenCalledWith(createData);
//     });
// });

// describe("notesService/edit", () => {
//     it("should update and return the updated note", async () => {
//         const noteId = "id1";
//         const updateData: CreateNoteDataType = {
//             title: "Updated title",
//             content: "Updated content",
//         };
//         const mockUpdate: Partial<MockNoteInterface> = {
//             _id: noteId,
//             ...updateData,
//             createdAt: new Date("2024-01-01"),
//         };

//         mockedNote.findByIdAndUpdate.mockResolvedValue(
//             mockUpdate as MockNoteInterface
//         );

//         const result = await noteService.edit(noteId, updateData);

//         const expected: NoteResponseType = {
//             _id: noteId,
//             title: "Updated title",
//             content: "Updated content",
//             createdAt: new Date("2024-01-01"),
//         };

//         expect(mockedNote.findByIdAndUpdate).toHaveBeenCalledWith(
//             noteId,
//             updateData,
//             {
//                 runValidators: true,
//                 new: true,
//             }
//         );
//         expect(result).toEqual(expected);
//     });

//     it("should throw CustomError if no note is found to update", async () => {
//         mockedNote.findByIdAndUpdate.mockResolvedValue(null);

//         await expect(
//             noteService.edit("id1", { title: "x", content: "y" })
//         ).rejects.toThrow(CustomError);
//     });
// });

// describe("notesService/remove", () => {
//     afterEach(() => {
//         jest.clearAllMocks();
//     });

//     it("should delete a note", async () => {
//         const mockDelete: Partial<MockNoteInterface> = {
//             _id: "id1",
//             title: "to delete",
//             content: "something",
//             createdAt: new Date("2024-01-01"),
//         };
//         mockedNote.findByIdAndDelete.mockResolvedValue(
//             mockDelete as MockNoteInterface
//         );

//         await noteService.remove("id1");

//         expect(mockedNote.findByIdAndDelete).toHaveBeenCalledWith("id1");
//     });

//     it("should throw CustomError when note not found!", async () => {
//         mockedNote.findByIdAndDelete.mockResolvedValue(null);

//         await expect(noteService.remove("id1")).rejects.toThrow(CustomError);
//     });
// });

// describe("notesService/getById", () => {
//     afterEach(() => {
//         jest.clearAllMocks();
//     });

//     it("should return the note by ID ", async () => {
//         const mockNote: Partial<MockNoteInterface> = {
//             _id: "id1",
//             title: "Title",
//             content: "Content",
//             createdAt: new Date("2024-01-01"),
//         };

//         mockedNote.findById.mockResolvedValue(mockNote as MockNoteInterface);

//         const result = await noteService.getById("id1");

//         const expected: NoteResponseType = {
//             _id: "id1",
//             title: "Title",
//             content: "Content",
//             createdAt: new Date("2024-01-01"),
//         };

//         expect(result).toEqual(expected);
//         expect(mockedNote.findById).toHaveBeenCalledWith("id1");
//     });

//     it("should throw CustomError when note is not found", async () => {
//         mockedNote.findById.mockResolvedValue(null);

//         await expect(noteService.getById("id1")).rejects.toThrow(CustomError);
//     });
// });
