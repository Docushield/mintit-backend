import express from "express";
let router=express.Router();
import {signup_with_google} from '../controller/signup.js';
/*router.get("/",(re,res)=>{
    res.send("<h1><center>WEL-COME PAGE</center></h1>");
});*/
router.get("/",signup_with_google);
export {router};