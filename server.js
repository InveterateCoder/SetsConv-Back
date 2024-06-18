require("dotenv").config();
const fs = require("fs/promises");
const path = require("path");
const express = require("express");

const RATESPTH = path.join(__dirname, "rates.json");

const app = express();
app.use(express.json());

app.get("/rates", async (req, res) => {
  let rates = null;
  try {
    const ratesJson = await fs.readFile(RATESPTH, { encoding: "utf-8" });
    rates = JSON.parse(ratesJson);
  } catch (err) {
    if (err.code !== "ENOENT") {
      return res.status(500).send(err.message);
    }
  }
  const nowUnixTs = +new Date() / 1000;
  if (!rates || nowUnixTs - rates.timestamp > 86400) {
    // TODO get rates
  }
  res.json(rates);
});

app.listen(+process.env.PORT, () =>
  console.log(`listening on port ${process.env.PORT}`)
);
