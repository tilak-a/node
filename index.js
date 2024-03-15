require("dotenv").config();
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});
const connectDB = require("./DBconnect");
const allApiRoutes = require("./routes/allApiRoutes.routes");

const port = process.env.PORT || 8000;

app.use(express.json({ limit: "10000kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// app.use(express.static("public"));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3001"
  })
);

// Serve static files from the React build folder
app.use(express.static(path.join(__dirname, "build")));

app.get("/api/messages/:userId/:senderId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const senderId = req.params.senderId;

    console.log("senderId", senderId, userId);
    // Fetch messages where the senderId or recipientId matches the userId
    const messages = await Message.find({
      $or: [
        { $and: [{ senderId: userId }, { recipientId: senderId }] },
        { $and: [{ senderId: senderId }, { recipientId: userId }] }
      ]
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/editmessage/:msgId", async (req, res) => {
  try {
    const msgId = req.params.msgId;
    const msg = req.body.message;

    const messageUpdate = await Message.findByIdAndUpdate(msgId, {
      message: msg
    });

    if (!messageUpdate) {
      return res.status(404).json({ message: "Message not found" });
    }

    const messageUpdated = await Message.findById(msgId);

    res.status(200).json({
      messages: messageUpdated,
      message: "Message Updated successfully"
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/deletemessages/:msgId", async (req, res) => {
  try {
    const msgId = req.params.msgId;

    console.log("msgId", msgId);
    // Fetch messages where the senderId or recipientId matches the userId
    const messages = await Message.findByIdAndDelete(msgId);
    if (!messages) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.status(200).json({
      messages: messages,
      message: "Message deleted successfully"
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete(
  "/api/deleteallmessages/userId=:userId&senderId=:senderId",
  async (req, res) => {
    try {
      const { userId, senderId } = req.params;
      console.log("userId:", userId);
      console.log("senderId:", senderId);

      // delete messages where the senderId or recipientId matches the userId
      const messages = await Message.deleteMany({
        $or: [
          { $and: [{ senderId: userId }, { recipientId: senderId }] },
          { $and: [{ senderId: senderId }, { recipientId: userId }] }
        ]
      });

      if (!messages) {
        return res.status(404).json({ message: "Message not found" });
      }

      res.status(200).json({
        messages: `${messages.deletedCount} deleted successfully`,
        message: "Messages deleted successfully"
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.use("/api", allApiRoutes);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
});

io.use((socket, next) => {
  // Extract token from handshake headers
  const token = socket.handshake.auth.token;
  // console.log("sss", token);

  if (!token) {
    return next(new Error("Unauthorized: No token provided"));
  }

  // Verify JWT token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error("Unauthorized: Invalid token"));
    }

    // Add decoded token to the socket object
    socket.decodedToken = decoded;
    next();
  });
});

const userSocketMap = {};

io.on("connection", socket => {
  console.log("Socket connected:", socket.id);

  // Handle when a user sends a message
  socket.on("msg", async ({ msg, recipientId, senderId, name }) => {
    try {
      // Ensure that the senderId and recipientId are provided
      if (!senderId || !recipientId) {
        throw new Error("Sender ID or recipient ID is missing");
      }

      // Emit the message to the recipient
      const recipientSocketId = userSocketMap[recipientId];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("recive", {
          message: msg,
          senderId,
          recipientId,
          name,
          timestamp: Date.now()
        });
      } else {
        console.log("Recipient socket not found for user ID:", recipientId);
      }

      // Optionally, you can also emit the message to the sender
      const senderSocketId = userSocketMap[senderId];
      if (senderSocketId) {
        io.to(senderSocketId).emit("recive", {
          message: msg,
          senderId,
          recipientId,
          name,
          timestamp: Date.now()
        });
      } else {
        console.log("Sender socket not found for user ID:", senderId);
      }

      // Save the message to the database or perform other actions as needed
      if (!senderId) {
        throw new Error("Sender ID is missing or invalid");
      }

      await saveMessageToDatabase(senderId, recipientId, msg);
    } catch (error) {
      console.error("Error handling message:", error);
    }
  });

  // Add the socket ID to the userSocketMap when a user connects
  socket.on("userId", userId => {
    userSocketMap[userId] = socket.id;
  });

  // Remove the socket ID from the userSocketMap when a user disconnects
  socket.on("disconnect", () => {
    for (const userId in userSocketMap) {
      if (userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];
        break;
      }
    }
    console.log("Socket disconnected:", socket.id);
  });
});

// Define the schema for messages
const messageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  recipientId: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Create the Message model
const Message = mongoose.model("Message", messageSchema);

async function saveMessageToDatabase(senderId, recipientId, msg) {
  // Your code to save the message to the database
  // Example: MongoDB
  const newMessage = new Message({
    senderId: senderId,
    recipientId: recipientId,
    message: msg,
    timestamp: Date.now()
  });
  await newMessage.save();
}

connectDB()
  .then(() => {
    httpServer.listen(port, (req, res) => {
      console.log("listening on port", port);
    });
  })
  .catch(err => {
    console.log("error in server listening on port", err);
  });

// app.get("/", (req, res) => {
//   res.setHeader("Content-Type", "text/html");
//   res.status(200);
//   // res.sendFile(path.join(__dirname, "public", "index.html"));
// });

// app.use("/api/users", userRouter);

// app.get("*", (req, res) => {
//   res.status(404);
//   res.json({
//     status: 404,
//     message: "Not Found"
//   });
// });

/* before */
// const express = require("express");
// const fs = require("fs");

// const server = express();
// const port = 8000;

// const data = JSON.parse(fs.readFileSync("data.json", "utf8"));
// const products = data.products;

// server.get("/prod/:id", (req, res) => {
//   const id = req.params.id;
//   const product = products.find(p => p.id == id);
//   res.send(product);
// });

// server.listen(port, () => {
//   console.log("listening on " + port);
// });

/*Node */

// const http = require("http");
// const fs = require("fs");
// const https = require("https");

// const doc = fs.readFileSync("index.html", "utf8");
// // const data = JSON.parse(fs.readFileSync("data.json", "utf8"));
// // const products = data.products;

// let data = {};
// const fetchData = () => {
//   https.get("https://dummyjson.com/products", apiRes => {
//     let apiData = "";

//     // Concatenate chunks of data
//     apiRes.on("data", chunk => {
//       apiData += chunk;
//     });

//     // Parse the JSON data when the response is complete
//     apiRes.on("end", () => {
//       data = JSON.parse(apiData);
//       // console.log("Data fetched from API:", data);
//     });
//   });
// };

// // Fetch data when the server starts
// fetchData();

// const server = http.createServer((req, res) => {
//   console.log(req.url);

//   switch (req.url) {
//     case "/":
//       res.end("from /");
//       break;
//     case "/doc":
//       res.end(doc);
//       break;
//     // case "/data":
//     //   res.setHeader("Content-Type", "text/html");
//     //   const allProductsHTML = products
//     //     .map(product => {
//     //       let productHTML = doc
//     //         .replace("imgurl", product.thumbnail)
//     //         .replace("title", product.title)
//     //         .replace("price", product.price)
//     //         .replace("rating", product.rating);
//     //       return productHTML;
//     //     })
//     //     .join("");
//     //   res.end(allProductsHTML);
//     //   break;
//     case "/data":
//       res.setHeader("Content-Type", "text/html");
//       const products = data.products || [];
//       const allProductsHTML = products
//         .map(product => {
//           let productHTML = doc
//             .replace("imgurl", product.thumbnail)
//             .replace("title", product.title)
//             .replace("price", product.price)
//             .replace("rating", product.rating);

//           return productHTML;
//         })
//         .join("");
//       res.end(allProductsHTML);
//       break;
//     default:
//       if (req.url.startsWith("/data")) {
//         const url = req.url.split("/")[2];
//         const products = data.products || [];
//         const prd = products.find(p => p.id === +url);
//         console.log(prd);

//         if (prd) {
//           res.setHeader("Content-Type", "text/html");
//           const modiftData = doc
//             .replace("title", prd.title)
//             .replace("price", prd.price)
//             .replace("rating", prd.rating)
//             .replace("imgurl", prd.thumbnail);
//           res.end(modiftData);
//         } else {
//           res.writeHead(404);
//           res.end();
//           return;
//         }
//         return;
//       }
//       res.writeHead(404);
//       res.end();
//       break;
//   }

//   console.log("server function satrted.");
// });

// server.listen(8000);

// console.log("helll");
