const User = require("../../models/user.model");
const uploadOnCloudinary = require("../../utils/Cloudinary");
const cloudinary = require('cloudinary').v2; // Import Cloudinary library

const userProfile = async (req, res) => {
  try {
    const userId = req.authm?._id;
    const { buffer } = req.file; // Access the file content from the buffer

    if (!buffer) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload new image to Cloudinary
    const cloudinaryResponse = await uploadOnCloudinary(buffer);

    if (!cloudinaryResponse) {
      return res.status(500).json({ message: 'Error uploading profile picture in p' });
    }

    console.log("cloudinaryResponse.url", cloudinaryResponse.url);

    // Get the user's data to retrieve the previous profile picture URL
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Extract the previous profile picture URL
    const previousProfilePicUrl = user.profilePic;

    // Delete the previous profile picture from Cloudinary
    if (previousProfilePicUrl) {
      const publicId = previousProfilePicUrl.split('/').pop().split('.')[0]; // Extract public ID from URL
      await cloudinary.uploader.destroy(publicId);
    }

    // Update user's profilePic with the new URL
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { profilePic: cloudinaryResponse.url } },
      { new: true, upsert: true }
    );

    if (!updatedUser) {
      return res.status(500).json({ message: 'Error updating profile picture URL' });
    }

    res.status(200).json({
      message: 'Profile picture uploaded successfully',
      profilePicUrl: cloudinaryResponse.url
    });

  } catch (err) {
    console.error('Error uploading profile picture:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = userProfile;




// const User = require("../../models/user.model");
// const uploadOnCloudinary = require("../../utils/Cloudinary");

// const userProfile = async (req, res) => {
//   try {
//     const userId = req.authm?._id;
//     const { buffer } = req.file; // Access the file content from the buffer

//     // console.log("Body : ", req.body);
//     // console.log("File: ", req.file);

//     if (!buffer) {
//       return res.status(400).json({ message: "No file uploaded" });
//     }

//     const cloudinaryResponse = await uploadOnCloudinary(buffer);

//     if (!cloudinaryResponse) {
//       return res.status(500).json({ message: 'Error uploading profile picture in p' });
//     }

//     console.log("cloudinaryResponse.url", cloudinaryResponse.url);
//     // console.log("id", userId);
    
//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { $set: { profilePic: cloudinaryResponse.url } },
//       { new: true, upsert: true }
//     );

//     // console.log("updatedUser", updatedUser);

//     if (!updatedUser) {
//       return res.status(500).json({ message: 'Error updating profile picture URL' });
//     }

//     res.status(200).json({
//       message: 'Profile picture uploaded successfully',
//       profilePicUrl: cloudinaryResponse.url
//     });

//   } catch (err) {
//     console.error('Error uploading profile picture in perr:', err);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

// module.exports = userProfile ;
