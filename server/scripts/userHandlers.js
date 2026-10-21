"use strict";
// const mysql = require("mysql2");
const options = require("./options.json");


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