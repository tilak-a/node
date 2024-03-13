const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conncectInstance = await mongoose.connect(
      `${process.env.MONGO_ATLAS_URL}/${process.env.DB_NAME}`
    );
    console.log("Mongo db connected", conncectInstance.connection.host);
  } catch (err) {
    console.log("Mongo db connection error", err);
    process.exit(1);
  }
};

module.exports = connectDB;
