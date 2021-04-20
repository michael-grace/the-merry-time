/**
 * Michael Grace
 * michael-grace.uk
 */

import express from "express";
import { readFile, writeFile } from "fs";
const app = express();
const port = process.env.PORT | 8080;

var appData;

readFile("scores.json", (err, data) => {
    if (err) {
        throw err;
    }
    appData = JSON.parse(data);
});

// No, this doesn't get it to send back a 500
const writeback = async() => {
    writeFile("scores.json", JSON.stringify(appData, null, 4), (err) => {
        if (err) {
            console.log("Error:", err);
        }
    });
};

app.set("view engine", "pug");
app.set("views", "views");

app.get("/data", (_, res) => {
    res.json(appData);
});

app.get("/", (_, res) => {
    res.render("index", {
        scores: Object.keys(appData.scores).map((elem) => {
            return { name: elem, score: appData.scores[elem] };
        }),
    });
});

app.get("/add/:name/:confirm?", (req, res) => {
    let name = req.params.name;
    let confirm = req.params.confirm;

    if (name in appData.scores) {
        appData.scores[name]++;
        res.status(200).send("Added to: " + name);
        writeback();
        return;
    }

    if (confirm === "yes") {
        appData.scores[name] = 1;
        res.status(200).send("Now in Competition: " + name);
        writeback();
        return;
    }

    res.status(400).send("Confirmation Needed. Correct Person? " + name);
});

app.listen(port, () => {
    console.log("Started on Port:", port);
});