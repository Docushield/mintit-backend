"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.login = void 0;
function login(req, res) {
    // FIXME: Add logic for validation and return valid token.
    return res.status(200).json({ "token": "ABCD" });
}
exports.login = login;
function logout(req, res) {
    console.log(req.headers['X-Auth-Token']);
    // FIXME: add validation on the above header
    return res.status(200).json({});
}
exports.logout = logout;
