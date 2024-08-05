const fs = require("fs");
const express = require("express");
const puppeteer = require("puppeteer");
const fileUpload = require("express-fileupload");

const app = express();
const port = 9000;

app.use(fileUpload());
app.use(express.static("public"));
app.use(express.json()); // Add this middleware to parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Add this middleware to parse URL-encoded bodies

app.post("/upload", async (req, res) => {
  try {
    if (!req.body.url) {
      return res.status(400).send("No URL provided.");
    }

    const url = req.body.url;
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    const pdfBuffer = await page.pdf({ format: "A4" });

    await browser.close();

    const file = "output.pdf";
    fs.writeFileSync(file, pdfBuffer);

    res.download(file, "output.pdf", (err) => {
      if (err) {
        console.error("Error downloading file:", err);
        return res.status(500).send("Error downloading file.");
      }
      fs.unlinkSync(file);
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error.");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
