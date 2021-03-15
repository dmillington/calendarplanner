const express = require("express");
const app = express();
const port = 8000;

app.use(express.static('docs/'));

app.get("/", (req, res) => {
    res.sendFile("index.html", { root: __dirname  + '/docs/'})
});

app.get("/app", (req, res) => {
    res.sendFile("app.html", { root: __dirname + '/docs/'})
});

app.get("/privacypolicy", (req, res) => {
    res.sendFile("privacypolicy.html", { root: __dirname + '/docs/'})
});

const server = app.listen(port);