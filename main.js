const express = require("express");
const app = express();
const port = 8000;

app.use(express.static('public'));

app.get("/", (req, res) => {
    res.sendFile("index.html", { root: __dirname })
});

const server = app.listen(port);