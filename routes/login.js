var express = require("express");
var router = express.Router();
const {
  Register,
  Login,
  Verify,
  Logout,
  isUserLoggedIn,
} = require("../Services/AuthService");
// const { registerUser, verifyUser } = require("../controllers/AuthController");

router.post("/login", Login);
router.get("/test");

router.get("/login", (req, res) => {
  if (req.query.callback) {
    res.render("login", {
      success: true,
      redirect: true,
      url: req.query.callback,
    });
  } else {
    res.render("login", { success: true, redirect: false });
  }
});
// router.get("/verify",(req,res)=>{

// })
router.post("/verify", Verify);
router.get("/register", (req, res) => {
  res.render("register", { success: true });
});
router.post("/signup", Register);
router.get("/userLoggedIn", isUserLoggedIn);
router.get("/logout", Logout);

// router.get("/login",);

module.exports = router;
