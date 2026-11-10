const express = require("express");
const session = require("express-session");

function setupSession(app) {
    const sessionSecret = process.env.SESSION_SECRET;

    if (!sessionSecret) {
        throw new Error("SESSION_SECRET has to be set before starting the server");
    }

    app.use(express.json());
    app.use(session({
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 8 * 60 * 60 * 1000,
        },
    }));
}

module.exports = setupSession;
