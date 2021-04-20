/**
 * Michael Grace
 * michael-grace.uk
 */

import express from "express";
import { readFile, writeFile, existsSync, copyFileSync } from "fs";
import { Storage } from "@google-cloud/storage";

const app = express();
const port = process.env.PORT | 8080;

const storage = new Storage();
var bucket;

if (process.env.GCLOUD_STORAGE_BUCKET) {
    bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET);

    bucket.getFiles((err, files) => {
        if (err) {
            throw err;
        }
        files.forEach((element) => {
            if (element.name === "scores.json") {
                element.download({ destination: "/tmp/scores.json" });
            }
        });
    });
}

var appData;

if (!existsSync("tmp/scores.json")) {
    copyFileSync("scores.json", "/tmp/scores.json");
}

readFile("/tmp/scores.json", (err, data) => {
    if (err) {
        throw err;
    }
    appData = JSON.parse(data);
});

// No, this doesn't get it to send back a 500
const writeback = async() => {
    writeFile("/tmp/scores.json", JSON.stringify(appData, null, 4), (err) => {
        if (err) {
            console.log("Error:", err);
        }
    });

    if (process.env.GCLOUD_STORAGE_BUCKET) {
        bucket.upload("/tmp/scores.json");
    }
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