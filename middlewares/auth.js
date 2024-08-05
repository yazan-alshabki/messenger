const isLogin = async (req, res, next) => {
  const token = req.cookies.user;
  try {
    if (token) {
      next();
    } else {
      res.redirect("/");
    }
  } catch (err) {
    console.log(err.message);
  }
  // try {
  //   if (!req.session.user) {
  //     res.redirect("/");
  //   }
  //   next();
  // } catch (err) {
  //   console.log(err.message);
  // }
};
const isLogout = async (req, res, next) => {
  try {
    const token = req.cookies.user;
    if (token) {
      res.redirect("/dashboard");
    }
    next();
  } catch (err) {
    console.log(err.message);
  }
};
module.exports = {
  isLogout,
  isLogin,
};
