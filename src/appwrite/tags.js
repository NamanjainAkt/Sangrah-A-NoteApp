import conf from '../conf/conf.js';
import { Client, ID, Databases, Query, Permission, Role } from "appwrite";

/**
 * Tags Service for Appwrite
 * Handles CRUD operations for tags
 */
class TagsService {
  client = new Client();
  databases;

  constructor() {
    this.client
      .setEndpoint(conf.appwriteUrl)
      .setProject(conf.appwriteProjectId);
    this.databases = new Databases(this.client);
  }

  /**
   * Create a new tag
   * @param {Object} tag - Tag object with name, color, etc.
   * @returns {Object} Created tag document
   */
  async createTag(tag) {
    try {
      return await this.databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdTags || 'tags',
        ID.unique(),
        {
          name: tag.name,
          color: tag.color,
          usageCount: tag.usageCount || 0,
          userId: tag.userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        [
          Permission.read(Role.user(tag.userId)),
          Permission.update(Role.user(tag.userId)),
          Permission.delete(Role.user(tag.userId))
        ]
      );
    } catch (error) {
      console.log("Appwrite service :: createTag :: error", error);
      throw error;
    }
  }

  /**
   * Get all tags for a user
   * @param {string} userId - User ID
   * @returns {Array} List of tag documents
   */
  async getTags(userId) {
    try {
      const response = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdTags || 'tags',
        [Query.equal('userId', userId)]
      );
      return response.documents;
    } catch (error) {
      console.log("Appwrite service :: getTags :: error", error);
      throw error;
    }
  }

  /**
   * Update a tag
   * @param {string} tagId - Tag document ID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated tag document
   */
  async updateTag(tagId, updates) {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdTags || 'tags',
        tagId,
        updateData
      );
    } catch (error) {
      console.log("Appwrite service :: updateTag :: error", error);
      throw error;
    }
  }

  /**
   * Delete a tag
   * @param {string} tagId - Tag document ID
   * @returns {boolean} Success status
   */
  async deleteTag(tagId) {
    try {
      await this.databases.deleteDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdTags || 'tags',
        tagId
      );
      return true;
    } catch (error) {
      console.log("Appwrite service :: deleteTag :: error", error);
      throw error;
    }
  }

  /**
   * Get tag usage statistics
   * @param {string} tagId - Tag document ID
   * @returns {Object} Usage statistics
   */
  async getTagUsage(tagId) {
    try {
      return await this.databases.getDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdTags || 'tags',
        tagId
      );
    } catch (error) {
      console.log("Appwrite service :: getTagUsage :: error", error);
      throw error;
    }
  }

  /**
   * Increment tag usage count
   * @param {string} tagId - Tag document ID
   * @returns {Object} Updated tag document
   */
  async incrementTagUsage(tagId) {
    try {
      const tag = await this.databases.getDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdTags || 'tags',
        tagId
      );

      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdTags || 'tags',
        tagId,
        {
          usageCount: (tag.usageCount || 0) + 1,
          updatedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.log("Appwrite service :: incrementTagUsage :: error", error);
      throw error;
    }
  }

  /**
   * Decrement tag usage count
   * @param {string} tagId - Tag document ID
   * @returns {Object} Updated tag document
   */
  async decrementTagUsage(tagId) {
    try {
      const tag = await this.databases.getDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdTags || 'tags',
        tagId
      );

      const newCount = Math.max(0, (tag.usageCount || 1) - 1);

      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdTags || 'tags',
        tagId,
        {
          usageCount: newCount,
          updatedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.log("Appwrite service :: decrementTagUsage :: error", error);
      throw error;
    }
  }
}

const tagsService = new TagsService();
export default tagsService;