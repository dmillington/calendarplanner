const express = require("express");
const app = express();
const port = 8000;

app.set("view engine", "pug");
app.set("views", "./views");
app.use(express.static('public'));

app.get("/", (req, res) => {
    res.render("index");
});

const server = app.listen(port);