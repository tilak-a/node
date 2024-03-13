const cloudinary = require("cloudinary");
const fs = require("fs").promises;
const { Readable } = require("stream");
const os = require("os");
const path = require("path");

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async fileBuffer => {
  try {
    if (!fileBuffer) return null;

    // Create a temporary file from the buffer
    const tempFilePath = path.join(os.tmpdir(), `temp-${Date.now()}.jpg`);
    await fs.writeFile(tempFilePath, fileBuffer);

    // Upload the temporary file on Cloudinary
    const cloudinaryResponse = await cloudinary.uploader.upload(tempFilePath, {
      resource_type: "auto"
    });

    // Remove the temporary file
    await fs.unlink(tempFilePath);

    return cloudinaryResponse;
  } catch (error) {
    // Handle error
    console.error("Error uploading profile picture err:", error);
    return null;
  }
};

module.exports = uploadOnCloudinary;
