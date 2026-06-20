const { cloudinary } = require('d:/BARBARA E-commerce/src/lib/cloudinary.ts');
require('dotenv').config({ path: 'd:/BARBARA E-commerce/.env.local' });

// Reconfigure with loaded env just in case
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function run() {
  try {
    console.log("Testing Cloudinary upload using credentials:");
    console.log("cloud_name:", process.env.CLOUDINARY_CLOUD_NAME);
    console.log("api_key:", process.env.CLOUDINARY_API_KEY);
    
    // A 1x1 transparent pixel base64 image
    const dummyImageUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    
    console.log("Uploading dummy image...");
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        dummyImageUri,
        {
          folder: "test_avatars",
        },
        (error, res) => {
          if (error) reject(error);
          else resolve(res);
        }
      );
    });

    console.log("Upload success!");
    console.log("URL:", result.secure_url);
    console.log("Public ID:", result.public_id);

    console.log("Cleaning up and deleting uploaded image...");
    const deleteResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(result.public_id, (error, res) => {
        if (error) reject(error);
        else resolve(res);
      });
    });
    console.log("Delete result:", deleteResult);

  } catch (err) {
    console.error("Cloudinary test failed with error:", err);
  }
}

run();
