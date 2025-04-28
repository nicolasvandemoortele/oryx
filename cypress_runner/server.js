const config  = require('../oryx.config');
const express = require('express');
const run = require('./run');

const port = config.port;

const app = express();

run.processMessage();

app.get("/", (_req, res) => {
    res.status(200).send("Server is running");
});
app.listen(port, () => {
    console.log(`Cypress runner running on port ${port}`);
});
