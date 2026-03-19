const conf = {
    appwriteUrl: String(import.meta.env.VITE_APPWRITE_URL),
    appwriteProjectId: String(import.meta.env.VITE_APPWRITE_PROJECT_ID),
    appwriteDatabaseId: String(import.meta.env.VITE_APPWRITE_DATABASE_ID),
    appwriteCollectionId: String(import.meta.env.VITE_APPWRITE_COLLECTION_ID),
    appwriteBucketId: String(import.meta.env.VITE_APPWRITE_BUCKET_ID),
    // Phase 2 Collection IDs
    appwriteCollectionIdActivity: String(import.meta.env.VITE_APPWRITE_COLLECTION_ID_ACTIVITY),
    appwriteCollectionIdGoals: String(import.meta.env.VITE_APPWRITE_COLLECTION_ID_GOALS),
    appwriteCollectionIdNotifications: String(import.meta.env.VITE_APPWRITE_COLLECTION_ID_NOTIFICATIONS),
    appwriteCollectionIdPreferences: String(import.meta.env.VITE_APPWRITE_COLLECTION_ID_PREFERENCES),
}

export default conf