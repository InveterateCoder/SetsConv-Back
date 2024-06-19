require("dotenv").config();
const fs = require("fs/promises");
const path = require("path");
const express = require("express");
const { rateLimit } = require("express-rate-limit");

const RATESPTH = path.join(__dirname, "rates.json");

const SECOND = 1000;
const MINUTE = 60 * SECOND;

const limiter = rateLimit({
  windowMs: 1 * MINUTE,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

const app = express();
app.use(express.json());
app.use(limiter);

app.get("/rates", async (req, res) => {
  let rates = null;
  try {
    const ratesJson = await fs.readFile(RATESPTH, { encoding: "utf-8" });
    rates = JSON.parse(ratesJson);
  } catch (err) {
    if (err.code !== "ENOENT") {
      return res.status(500).send(`Failed to read local data: ${err.message}`);
    }
  }
  const nowUnixTs = Math.floor(+new Date() / 1000);
  if (!rates || nowUnixTs - rates.unixts > +process.env.REFRESH_IN_S) {
    try {
      const fetchRes = await fetch(
        `https://openexchangerates.org/api/latest.json?app_id=${process.env.OPENXCHANGERATES_APP_ID}`
      );
      if (!fetchRes.ok) {
        const msg = await fetchRes.text();
        throw new Error(msg);
      }
      rates = await fetchRes.json();
      rates.unixts = nowUnixTs;
    } catch (err) {
      return res.status(500).send(`Failed to get latest rates: ${err.message}`);
    }
    try {
      await fs.writeFile(RATESPTH, JSON.stringify(rates), {
        encoding: "utf-8",
        flag: "w",
      });
    } catch (err) {
      return res.status(500).send(`Failed to save local data: ${err.message}`);
    }
  }
  res.json(rates);
});

app.listen(+process.env.PORT, () =>
  console.log(`listening on port ${process.env.PORT}`)
);
