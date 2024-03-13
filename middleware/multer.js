const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  dest: "../uploads",
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadMiddleware = (req, res, next) => {
  //   console.log("Headers:", req.headers);
  // console.log("Body mutler:", req);

  upload.single("avatar")(req, res, err => {
    if (err) {
      // Handle multer error, e.g., file size exceeded or invalid file type
      return res
        .status(400)
        .json({ message: "File upload error in multer", error: err.message });
    }

    // req.file = file;
    next();
  });
};

module.exports = { uploadMiddleware };
