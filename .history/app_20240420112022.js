require("dotenv").config();
let mongoose = require("mongoose");
let express = require("express");
const app = express();
const userRoute = require("./routes/userRoute");
const http = require("http").Server(app);
const User = require("./models/userModel");
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
const PORT = process.env.PORT || 3000;
app.use("/", userRoute);
const io = require("socket.io")(http);
const usp = io.of("/user-namespace");
usp.on("connection", async function(socket) {
  console.log("User connected ______________________________!");
  const userId = socket.handshake.auth.token;
  await User.findByIdAndUpdate({ _id: userId }, { $set: { is_online: "1" } });
  // get user online 
  socket.broadcast.emit()
  socket.on("disconnect", async function() {
    console.log("user disconnect ______________________________!");
    const userId = socket.handshake.auth.token;
    await User.findByIdAndUpdate({ _id: userId }, { $set: { is_online: "0" } });
  });
});

http.listen(PORT, async () => {
  await connectDB();
  console.log(`Server is up on port:${PORT}`);
});
