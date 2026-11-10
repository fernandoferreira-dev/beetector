const express = require("express")

const app = express()
const port = process.env.SERVER_PORT || "undefined"


/**
 * @todo ligar o router e as sessões
 */


app.listen(port, () => {
    console.log(`Server started on port ${port}.`)
})
