var GoogleStrategy = require('passport-google-oauth20').Strategy;
const user = require('../model/user');
var authConfig=require('../shared/authConfig.js');
module.exports = function (passport) {
    passport.use(new GoogleStrategy({
        clientID:authConfig.clientIDForOAuth,
        clientSecret:authConfig.clientSecretForOAuth,
        callbackURL:authConfig.callBackUrlForOAuth
    },(accessToken, refreshToken, profile, done) => {
        var alreadyExist=false;
        // find if a user exist with this email or not
        user.findOne({ email: profile.emails[0].value }).then((data) => 
        {
            if (data) {
                // user exists, update data
                // I am skipping that part here, may Update Later
                alreadyExist=true;
                console.log("data",data);
                return done(alreadyExist, data);
            } else {
                // create a user
                user({
                    username: profile.displayName,
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    password: null,
                    provider: 'google',
                    isVerified: true,
                }).save(function (err, data) {
                    console.log("save data");
                    return done(alreadyExist, data);
                });
            }    
        });
    }
    ));
}