const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      required: [true, "First Name is required"],
    },
    lastName: {
      type: String,
      trim: true,
      required: [true, "Last Name is required"],
    },
    email: {
      type: String,
      trim: true,
      unique: true,
      required: [true, "Please enter your email"],
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [
        function () {
          return this.authenticated === "Regular";
        },
        "Please enter your password",
      ],
      trim: true,
      minLength: [8, "Password must be up to 8 characters"],
    },
    userType: {
      type: String,
      enum: ["admin", "teacher", "student"],
      default: "student",
    },
    photo: {
      type: String,
      default: "",
    },
    level: {
      type: String,
      default: "A1",
    },
    activated: {
      type: Boolean,
      default: false,
    },
    authenticated: {
      type: String,
      default: "Regular",
    },
    is_online: {
      type: String,
      default: "0",
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
