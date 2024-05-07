const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const Group = require("../models/groupModel");
const Member = require("../models/memberModel");
const GroupChat = require("../models/groupChatModel");
const bcryptjs = require("bcryptjs");
const { default: mongoose } = require("mongoose");
const groupModel = require("../models/groupModel");
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
        res.cookie("user", JSON.stringify(userData));
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
    res.clearCookie("user");
    req.session.destroy();
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
};

const loadDashboard = async (req, res) => {
  try {
    const user = req.session.user;
    const users = await User.find({ _id: { $nin: [user._id] } });
    res.render("dashboard", { user: user, users: users });
  } catch (err) {
    console.log(err);
  }
};

const saveChat = async (req, res) => {
  try {
    const chat = new Chat({
      sender_id: req.body.sender_id,
      receiver_id: req.body.receiver_id,
      message: req.body.message
    });
    const newChat = await chat.save();
    res.status(200).send({
      success: true,
      msg: "chat is send ",
      data: newChat
    });
  } catch (err) {
    res.status(400).send({
      success: false,
      msg: err.message
    });
  }
};

const deleteChat = async (req, res) => {
  try {
    await Chat.deleteOne({ _id: req.body.id });
    res.status(200).send({
      success: true,
      msg: "chat is deleted "
    });
  } catch (err) {
    res.status(400).send({
      success: false,
      msg: err.message
    });
  }
};
const updateChat = async (req, res) => {
  try {
    await Chat.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          message: req.body.message
        }
      }
    );
    res.status(200).send({
      success: true,
      msg: "chat is updated "
    });
  } catch (err) {
    res.status(400).send({
      success: false,
      msg: err.message
    });
  }
};

const loadGroups = async (req, res) => {
  try {
    const groups = await Group.find({ creator_id: req.session.user._id });
    res.render("group", { groups: groups });
  } catch (err) {
    console.log(err);
  }
};

const createGroup = async (req, res) => {
  try {
    const group = new Group({
      creator_id: req.session.user._id,
      name: req.body.name,
      image: "images/" + req.file.filename,
      limit: req.body.limit
    });
    await group.save();
    const groups = await Group.find({ creator_id: req.session.user._id });

    res.render("group", {
      message: req.body.name + " group created successfully",
      groups: groups
    });
  } catch (err) {
    console.log(err);
  }
};

const getMembers = async (req, res) => {
  try {
    console.log(req.body.group_id);
    const currentUserId = new mongoose.Types.ObjectId(req.session.user._id);
    const groupId = new mongoose.Types.ObjectId(req.body.group_id);
    console.log(groupId);
    const users = await User.aggregate([
      {
        $lookup: {
          from: "members",
          localField: "_id",
          foreignField: "user_id",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$group_id", groupId]
                    }
                  ]
                }
              }
            }
          ],
          as: "member"
        }
      },
      {
        $match: {
          _id: {
            $nin: [currentUserId]
          }
        }
      }
    ]);
    res.status(200).send({
      success: true,
      data: users
    });
  } catch (err) {
    res.status(400).send({
      success: false,
      msg: err.message
    });
  }
};

const addMembers = async (req, res) => {
  try {
    if (req.body.members.length === 0) {
      res.status(200).send({
        success: false,
        msg: "Please select any member"
      });
    } else if (req.body.members.length > parseInt(req.body.limit)) {
      res.status(200).send({
        success: false,
        msg: `You can not select more than ${req.body.limit} members`
      });
    } else {
      await Member.deleteMany({
        group_id: req.body.group_id
      });

      var data = [];
      const members = req.body.members;
      for (let i = 0; i < members.length; i++) {
        data.push({
          group_id: req.body.group_id,
          user_id: members[i]
        });
      }
      await Member.insertMany(data);
      res.status(200).send({
        success: true,
        msg: `Members added successfully`
      });
    }
  } catch (err) {
    res.status(400).send({
      success: false,
      msg: err.message
    });
  }
};

const updateChatGroup = async (req, res) => {
  try {
    if (parseInt(req.body.limit) < parseInt(req.body.last_limit)) {
      console.log("asd");
      await Member.deleteMany({ group_id: req.body.id });
    }
    var updateObj;
    if (req.file != undefined) {
      updateObj = {
        name: req.body.name,
        image: "images/" + req.file.filename,
        limit: req.body.limit
      };
    } else {
      updateObj = {
        name: req.body.name,
        limit: req.body.limit
      };
    }
    await Group.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: updateObj
      }
    );

    res.status(200).send({
      success: true,
      msg: "Chat group updated successfully !"
    });
  } catch (err) {
    res.status(400).send({
      success: false,
      msg: err.message
    });
  }
};
const deleteChatGroup = async (req, res) => {
  try {
    await Group.deleteOne({ _id: req.body.id });
    await Member.deleteMany({ group_id: req.body.id });
    res.status(200).send({
      success: true,
      msg: "Chat group deleted successfully !"
    });
  } catch (err) {
    res.status(400).send({
      success: false,
      msg: err.message
    });
  }
};

const shareGroup = async (req, res) => {
  try {
    const groupData = await Group.findOne({ _id: req.params.id });
    if (!groupData) {
      res.render("error", { message: "404 Not Found !" });
    } else if (req.session.user == undefined) {
      res.render("error", { message: "You need to login to share URL !" });
    } else {
      var totalMembers = await Member.countDocuments({
        group_id: req.params.id
      });
      var available = groupData.limit - totalMembers;

      var isOwner = groupData.creator_id == req.session.user._id ? true : false;
      var isJoined = await Member.countDocuments({
        group_id: req.params.id,
        user_id: req.session.user._id
      });

      res.render("shareLink", {
        group: groupData,
        totalMembers: totalMembers,
        isOwner: isOwner,
        isJoined: isJoined,
        available: available
      });
    }
  } catch (err) {
    console.log(err);
  }
};
const joinGroup = async (req, res) => {
  try {
    const member = new Member({
      group_id: req.body.group_id,
      user_id: req.session.user._id
    });
    await member.save();
    res.status(200).send({
      success: true,
      message: "Congratulation , you have joined this group !"
    });
  } catch (err) {
    res.status(400).send({
      success: false,
      msg: err.message
    });
  }
};
const groupChat = async (req, res) => {
  try {
    const myGroups = await Group.find({
      creator_id: req.session.user._id
    });
    const joinedGroups = await Member.find({
      user_id: req.session.user._id
    }).populate("group_id");

    res.render("chat-group", {
      myGroups: myGroups,
      joinedGroups: joinedGroups
    });
  } catch (err) {
    console.log(err);
  }
};

const saveGroupChat = async (req, res) => {
  try {
    const chat = new GroupChat({
      sender_id: req.body.sender_id,
      group_id: req.body.group_id,
      message: req.body.message
    });
    const newChat = await chat.save();
    var cChat = await GroupChat.findOne({ _id: newChat._id }).populate('sender_id');
    res.status(200).send({
      success: true,
      chat: cChat
    });
  } catch (err) {
    res.status(400).send({
      success: false,
      msg: err.message
    });
  }
};

const loadGroupChats = async (req, res) => {
  try {
    const groupChats = await GroupChat.find({
      group_id: req.body.group_id
    }).populate("sender_id");
    res.status(200).send({
      success: true,
      chats: groupChats
    });
  } catch (err) {
    res.status(400).send({
      success: false,
      msg: err.message
    });
  }
};


const deleteGroupChat = async (req, res) => {
  try {
    await GroupChat.deleteOne({ _id: req.body.id });
    res.status(200).send({
      success: true,
      msg: "Chat deleted successfully"
    });
  } catch (err) {
    res.status(400).send({
      success: false,
      msg: err.message
    });
  }
}


const updateGroupChat = async (req, res) => {
  try {
    await GroupChat.findByIdAndUpdate({ _id: req.body.id }, {
      message: req.body.message
    });
    res.status(200).send({
      success: true,
      msg: "Chat updated successfully"
    });
  } catch (err) {
    res.status(400).send({
      success: false,
      msg: err.message
    });
  }
}
module.exports = {
  register,
  registerLoad,
  loadLogin,
  login,
  logout,
  loadDashboard,
  saveChat,
  deleteChat,
  updateChat,
  loadGroups,
  createGroup,
  getMembers,
  addMembers,
  updateChatGroup,
  deleteChatGroup,
  shareGroup,
  joinGroup,
  groupChat,
  saveGroupChat,
  loadGroupChats,
  deleteGroupChat,
  updateGroupChat
};
