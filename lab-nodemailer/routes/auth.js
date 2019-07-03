const express = require("express");
const passport = require('passport');
const router = express.Router();
const User = require("../models/User");
require('dotenv').config();
const nodemailer = require('nodemailer');

// Bcrypt to encrypt passwords
const bcrypt = require("bcrypt");
const bcryptSalt = 10;

let transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: `${process.env.USER_NAME}`,
    pass: `${process.env.PASS}` 
  }
});


router.get("/login", (req, res, next) => {
  res.render("auth/login", { "message": req.flash("error") });
});

router.get("/profile", (req, res, next) => {
    res.render("auth/profile", { "message": req.flash("error") });
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/auth/profile",
  failureRedirect: "/auth/login",
  failureFlash: true,
  passReqToCallback: true
}));

router.get("/signup", (req, res, next) => {
  res.render("auth/signup");
});

router.post("/signup", (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;
  const email = req.body.email;
  const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let token = '';
  for (let i = 0; i < 25; i++) {
      token += characters[Math.floor(Math.random() * characters.length )];
  }
  if (username === "" || password === "") {
    res.render("auth/signup", { message: "Indicate username and password" });
    return;
  }

  User.findOne({ username }, "username", (err, user) => {
    if (user !== null) {
      res.render("auth/signup", { message: "The username already exists" });
      return;
    }

    const salt = bcrypt.genSaltSync(bcryptSalt);
    const hashPass = bcrypt.hashSync(password, salt);

    const newUser = new User({
      username,
      password: hashPass,
      email: email,
      token: token
    });

    newUser.save()
    .then(() => {
      transporter.sendMail({
        from: '"Ironhack Madrid 👻" <process.env.USER>',
        to: email, 
        subject: 'Week 5 Ironhack, Confirmation email', 
        text: 'Awesome Message',
        html: `<b>Confirm Account</b>
        <a
        href="http://localhost:3000/auth/confirm/${token}">Click here</a>`
      })
      .then(info => console.log(info))
      .catch(error => console.log(error))
      res.redirect("/");
    })
    .catch(err => {
      res.render("auth/signup", { message: "Something went wrong" });
    })
  });
});

router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

router.get("/confirm/:token", (req,res) => {
  let token = req.params.token;
  User.findOneAndUpdate({token: req.params.token},{$set:{status:"Active"}},{new:true})
  .then((user)=>{
    console.log("User activated");
    res.redirect("/auth/login")
  }).catch((err)=>{
    console.log(err)
  })
});

module.exports = router;
