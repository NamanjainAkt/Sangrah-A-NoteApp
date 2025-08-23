import conf from '../conf/conf.js';
import { Client, ID, Databases, Storage, Query } from "appwrite";

export class Service {
    client = new Client();
    databases;
    bucket;

    constructor() {
        this.client
            .setEndpoint(conf.appwriteUrl)
            .setProject(conf.appwriteProjectId);
        this.databases = new Databases(this.client);
        this.bucket = new Storage(this.client);
    }

    // Create a note (no slug, use ID.unique())
async createNote({ title, content, userId, isArchived, isImportant, isDeleted }) {
    try {
        return await this.databases.createDocument(
            conf.appwriteDatabaseId,
            conf.appwriteCollectionId,
            ID.unique(),
            {
                title,
                content,
                isArchived,
                isImportant,
                isDeleted,
                userId,  // ← saved in document
            },
            [
                Permission.read(Role.user(userId)),
                Permission.update(Role.user(userId)),
                Permission.delete(Role.user(userId))
            ]
        );
    } catch (error) {
        console.log("Appwrite service :: createNote :: error", error);
    }
}


    // Update a note by document ID
    async updateNote(noteId, { title, content, isArchived, isImportant, isDeleted }) {
        try {
            return await this.databases.updateDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                noteId,
                {
                    title,
                    content,
                    isArchived,
                    isImportant,
                    isDeleted
                }
            );
        } catch (error) {
            console.log("Appwrite service :: updateNote :: error", error);
        }
    }

    // Delete a note by document ID
    async deleteNote(noteId) {
        try {
            await this.databases.deleteDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                noteId
            );
            return true;
        } catch (error) {
            console.log("Appwrite service :: deleteNote :: error", error);
            return false;
        }
    }

    // Get a single note by document ID
    async getNote(noteId) {
        try {
            return await this.databases.getDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                noteId
            );
        } catch (error) {
            console.log("Appwrite service :: getNote :: error", error);
            return false;
        }
    }

    // Get notes for a user (optionally filter by archive, important, etc.)
    async getNotes(userId, extraQueries = []) {
        try {
            const queries = [Query.equal("userId", userId), ...extraQueries];
            return await this.databases.listDocuments(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                queries
            );
        } catch (error) {
            console.log("Appwrite service :: getNotes :: error", error);
            return false;
        }
    }

}

const service = new Service();
export default service;