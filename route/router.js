var express = require('express');
var passport = require('passport');
let router=express.Router();
require('../controller/googleAuth.js')(passport);
var usersController=require('../controller/users.js');
var emailSend=require('../shared/emailSend.js');
router.get("/",(req,res)=>{
    res.send("<h1><center>Default Page</center></h1>");
});
router.get("/dashboard",(req,res)=>{
    res.send("<h1><center>Wel-Come To Dashboard</center></h1>");
});
router.get("/google",passport.authenticate("google",{scope:["profile","email"]}),(req,res)=>{
    res.send("<h1>signup successfully</h1>");
});
router.get('/google/callback',(req,res)=>
{

    emailSend.SendReportOnEmail("shreeprana26@gmail.com","Welcome to Docushield","Welcome to Docushield","");
    console.log("in callbackfunction")
    res.redirect('/');
});
module.exports = router;
