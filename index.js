require("dotenv").config();
let mongoose = require("mongoose");
let express = require("express");
const app = express();
const userRoute = require("./routes/userRoute");
const http = require("http").Server(app);
const User = require("./models/userModel");
const Chat = require("./models/chatModel");
const bodyParser = require("body-parser");
const cors = require("cors");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

const connectDB = async () => {
  mongoose
    .connect(process.env.LOCAL_DB)
    .then(() => {
      console.log("Database connected successfully.");
    })
    .catch(error => {
      console.log(error);
    });
};
const PORT = process.env.PORT;
app.use("/", userRoute);
const io = require("socket.io")(http);
const usp = io.of("/user-namespace");
usp.on("connection", async function (socket) {
  console.log("User connected ______________________________!");
  const userId = socket.handshake.auth.token;
  await User.findByIdAndUpdate({ _id: userId }, { $set: { is_online: "1" } });
  // get user online
  socket.broadcast.emit("getOnlineUser", { user_id: userId });

  socket.on("disconnect", async function () {
    console.log("user disconnect ______________________________!");
    const userId = socket.handshake.auth.token;

    // get user offline
    socket.broadcast.emit("getOfflineUser", { user_id: userId });
    await User.findByIdAndUpdate({ _id: userId }, { $set: { is_online: "0" } });
  });

  // chatting
  socket.on("newChat", function (data) {
    socket.broadcast.emit("loadNewChat", data);
  });

  // load old chats
  socket.on("existChat", async function (data) {
    const chats = await Chat.find({
      $or: [
        { sender_id: data.sender_id, receiver_id: data.receiver_id },
        { sender_id: data.receiver_id, receiver_id: data.sender_id }
      ]
    });
    socket.emit("loadChats", { chats: chats });
  });
  // delete chats
  socket.on("chatDeleted", function (id) {
    socket.broadcast.emit("chatMessageDeleted", id);
  });

  // update chats
  socket.on("chatUpdated", function (data) {
    console.log(data);
    socket.broadcast.emit("chatMessageUpdated", data);
  });

  // group chats added
  socket.on("newGroupChat", function (data) {
    socket.broadcast.emit("loadNewGroupChat", data);
  });


  // group chat delete 
  socket.on("groupChatDeleted", function (id) {
    socket.broadcast.emit("groupChatMessageDeleted", id);

  });
  // group chat updated
  socket.on("groupChatUpdated", function (data) {
    socket.broadcast.emit("groupChatMessageUpdated", data);
  });

});

http.listen(PORT, async () => {
  await connectDB();
  console.log(`Server is up on port:${PORT}`);
});
