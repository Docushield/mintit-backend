var express = require('express');
const mongoose = require('mongoose');
const expressSession = require('express-session');
const MemoryStore = require('memorystore')(expressSession)
const passport = require('passport');

var app=express();
var router  = require("./route/router.js");
app.use('/',router);
const mongoDBURI = require('./shared/mongoConfig.js');
console.log(mongoDBURI);
mongoose.connect(mongoDBURI,{ 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
})
.then(() => 
    console.log("DB Connected!")
);
app.use(expressSession({
    secret: "random",
    resave: true,
    saveUninitialized: true,
    // setting the max age to longer duration
    maxAge: 24 * 60 * 60 * 1000,
    store: new MemoryStore(),
}));
app.use(passport.initialize());
app.use(passport.session());
app.listen(8000,()=>{
    console.log("listen the port 8000");
});