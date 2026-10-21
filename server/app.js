const express = require("express")

const app = express()
const port = 3000

const userRouter = require("./routes/users")


app.use("/users", userRouter)


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})