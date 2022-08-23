var GoogleStrategy = require('passport-google-oauth20').Strategy;
const user = require('../model/user');
var authConfig=require('../shared/authConfig.js');
module.exports = function (passport) {
    passport.use(new GoogleStrategy({
        clientID:authConfig.clientIDForOAuth,
        clientSecret:authConfig.clientSecretForOAuth,
        callbackURL:authConfig.callBackUrlForOAuth,
    }, (accessToken, refreshToken, profile, done) => {
        console.log(profile._json);
        // find if a user exist with this email or not
        user.findOne({ email: profile.emails[0].value }).then((data) => {
            if (data) {
                // user exists
                // update data
                // I am skipping that part here, may Update Later
                return done(null, data);
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
                    return done(null, data);
                });
            }
        });
    }
    ));
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        user.findById(id, function (err, user) {
            done(err, user);
        });
    });
}