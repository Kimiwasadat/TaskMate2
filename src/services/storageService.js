import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";

/**
 * Uploads a local file (from device uri) to Firebase Storage
 *
 * @param {string} uri - The local file URI from Expo ImagePicker
 * @param {string} planId - The ID of the plan this relates to (for folder structure)
 * @param {string} stepId - The ID of the specific step
 * @returns {Promise<string>} The public download URL of the uploaded file
 */
export const uploadMediaToStorage = async (uri, planId, stepId) => {
  try {
    // 1. Convert the local URI to a Blob (required by Firebase)
    const response = await fetch(uri);
    const blob = await response.blob();

    // 2. Extract file extension (defaulting to .jpg if missing)
    const filename = uri.split("/").pop() || "media.jpg";
    const fileExtension = filename.split(".").pop() || "jpg";

    // 3. Create a clean storage path: plans/{planId}/steps/{stepId}_{timestamp}.{ext}
    const timestamp = new Date().getTime();
    const storagePath = `plans/${planId}/steps/${stepId}_${timestamp}.${fileExtension}`;

    // 4. Create a reference to Firebase Storage
    const fileRef = ref(storage, storagePath);

    // 5. Upload the blob
    await uploadBytes(fileRef, blob);

    // 6. Get the public download URL to save to Firestore
    const downloadUrl = await getDownloadURL(fileRef);
    return downloadUrl;
  } catch (error) {
    console.error("Error uploading to Firebase Storage:", error);
    throw error;
  }
};
