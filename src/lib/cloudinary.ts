import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

/**
 * Extracts the public_id of a Cloudinary image from its URL.
 * Example input: https://res.cloudinary.com/cloudname/image/upload/v123456/products/image_name.jpg
 * Example output: products/image_name
 */
export function extractPublicId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  if (!url.includes("res.cloudinary.com")) return null;

  try {
    const parts = url.split("/image/upload/");
    if (parts.length < 2) return null;

    let pathWithExt = parts[1];
    // Remove version prefix if exists (e.g. v12345678/)
    pathWithExt = pathWithExt.replace(/^v\d+\//, "");

    // Remove query params if any
    const queryIndex = pathWithExt.indexOf("?");
    if (queryIndex !== -1) {
      pathWithExt = pathWithExt.substring(0, queryIndex);
    }

    // Remove file extension
    const lastDotIndex = pathWithExt.lastIndexOf(".");
    if (lastDotIndex === -1) return pathWithExt;

    return pathWithExt.substring(0, lastDotIndex);
  } catch (error) {
    console.error("Error extracting public_id from Cloudinary URL:", error);
    return null;
  }
}

/**
 * Deletes an image from Cloudinary using its public_id.
 */
export async function deleteFromCloudinary(publicId: string): Promise<any> {
  if (!publicId) return null;
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error(`Failed to delete image ${publicId} from Cloudinary:`, error);
        reject(error);
      } else {
        console.log(`Successfully deleted image ${publicId} from Cloudinary:`, result);
        resolve(result);
      }
    });
  });
}
