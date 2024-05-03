require("dotenv").config();
let mongoose = require("mongoose");
let express = require("express");
const app = express();
const userRoute = require("./routes/userRoute");
const http = require("http").Server(app);
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
const io = require("socket");
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server is up on port:${PORT}`);
});
