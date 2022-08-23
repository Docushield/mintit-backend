var express = require('express');
var passport = require('passport');
let router=express.Router();
require('../controller/googleAuth.js')(passport);
router.get("/",(req,res)=>{
    res.send("<h1><center>Default Page</center></h1>");
});
router.get("/dashboard",(req,res)=>{
    res.send("<h1><center>Wel-Come To Dashboard</center></h1>");
});
router.get("/google",passport.authenticate("google",{scope:["profile","email"]}));
router.get("/google/callback",passport.authenticate("google",{failureRedirect:"/"}),(req,res)=>{
console.log("jjjjjjjjjjjjjjjjjjjjjjjjjjj");    
res.redirect('/dashboard');
});
module.exports = router;
