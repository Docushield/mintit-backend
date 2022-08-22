import express from 'express';
import passport from 'passport';
import googleStrategy from 'passport-google-oauth20';
var app=express();
import {router}  from "./route/router.js";
app.use('/sign-up',router);
passport.use(new googleStrategy({
    clientID:"148163534159-6ht3emvds8fjecgb59o12aiihmk0ct74.apps.googleusercontent.com",
    clientSecret:"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",
    callbackURL:"/auth/google/callback"
},(accessToken,refreshToken,profile,done)=>{
    console.log(accessToken);
    console.log(refreshToken);
    console.log(profile);
}))

app.get("/auth/google",passport.authenticate("google",{
    scope:["profile","email"]
}));
app.get("/auth/google/callback",passport.authenticate("google"))
app.listen(8000,()=>{
    console.log("listen the port 8000");
});