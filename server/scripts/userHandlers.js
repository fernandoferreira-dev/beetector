"use strict";
const bcrypt = require("bcrypt")

// const mysql = require("mysql2");w
const options = require("./options.json");


const register = async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const user = { name: req.body.name, password: hashedPassword }
        users.push(user)
        res.status(201).send()

        let connection = mysql.createConnection(options);

        connection.connect();

        let sql = "COUNT WHERE idUser = " + req.params.userId + " FROM hives";
        connection.query(sql, function (err, rows) {
            if (err) {
                res.json({ "Message": "404" });
            } else {
                res.json({
                    "Message": "200",
                    "person": rows
                });
            }
        });

        connection.end();

    } catch {
        res.status(500).send()
    }
}
module.exports.register = register;

const getUser = (req, res) => {
    const userId = req.params.userId;
    res.send(`Utilizador ${userId}`);
}
module.exports.getUser = getUser;

const updateUser = (req, res) => {

}
module.exports.updateUser = updateUser;

const deleteUser = (req, res) => {

}
module.exports.deleteUser = deleteUser;

const hiveQuantity = (req, res) => {
    let connection = mysql.createConnection(options);

    connection.connect();

    let sql = "COUNT WHERE idUser = " + req.params.userId + " FROM hives";
    connection.query(sql, function (err, rows) {
        if (err) {
            res.json({ "Message": "404" });
        } else {
            res.json({
                "Message": "200",
                "person": rows
            });
        }
    });

    connection.end();
}
module.exports.hiveQuantity = hiveQuantity;

const getPeople = (req, res) => {
    let connection = mysql.createConnection(options);

    connection.connect();

    let sql = "SELECT id, name, birthDate, idCountry FROM person";
    connection.query(sql, function (err, rows) {
        if (err) {
            res.json({ "Message": "Error MySQL query to person table" });
        } else {
            res.json({
                "Message": "Success",
                "person": rows
            });
        }
    });

    connection.end();
}
module.exports.getPeople = getPeople;

const getCountries = (req, res) => {
    let connection = mysql.createConnection(options);

    connection.connect();

    let sql = "SELECT id, name, shortname FROM country";
    connection.query(sql, function (err, rows) {
        if (err) {
            res.json({ "Message": "Error MySQL query to person table" });
        } else {
            res.json({
                "Message": "Success",
                "person": rows
            });
        }
    });

    connection.end();
}
module.exports.getCountries = getCountries;