const express = require("express")
const userHandlers = require("../scripts/userHandlers");

const router = express.Router()

router.get("/login", (req, res) => {
    res.send("login")
})

router.get("/register", (req, res) => {
    res.send("register")
})

router.get("/hiveQuantity/:userId", hiveQuantity)

router
    .route("/:userId")
    .get(userHandlers.getUser)
    .put((req, res) => {
        res.send(`Update ${req.params.userId}`)
    })
    .delete((req, res) => {
        res.send(`Delete ${req.params.userId}`)
    })


module.exports = router