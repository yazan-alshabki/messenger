const User = require("../models/userModel");
const bcryptjs = require("bcryptjs");
const registerLoad = async (req, res) => {
  try {
    res.render("register");
  } catch (err) {
    console.log(err);
  }
};
const register = async (req, res) => {
  try {
    const passwordHash = await bcryptjs.hash(req.body.password, 10);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: passwordHash,
      image: "/images/" + req.file.filename
    });
    await user.save();
    res.render("register", {
      message: "Your Registration has been Completed Successfully !"
    });
  } catch (err) {
    console.log(err);
  }
};
const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (err) {
    console.log(err);
  }
};
const login = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });
    if (userData) {
      const passwordMatch = await bcryptjs.compare(password, userData.password);
      if (passwordMatch) {
        req.session.user = userData;
        res.redirect("/dashboard");
      } else {
        res.render("login", { message: "Email or Password is incorrect " });
      }
    } else {
      res.render("login", { message: "Email or Password is incorrect " });
    }
  } catch (err) {
    console.log(err);
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
};

const loadDashboard = async (req, res) => {
  try {
    const user = req.session.user;
    User.find({ _id: { $nin: [user._id] } });
    res.render("dashboard", { user: user });
  } catch (err) {
    console.log(err);
  }
};
module.exports = {
  register,
  registerLoad,
  loadLogin,
  login,
  logout,
  loadDashboard
};
