const fs = require("fs");
const sharp = require("sharp");
const express = require("express");
const PDFDocument = require("pdfkit");
const fileUpload = require("express-fileupload");

const app = express();
const port = 9000;

app.use(fileUpload());
app.use(express.static("public"));

app.post("/upload", async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).send("No image uploaded.");
    }

    const imageData = Buffer.from(req.files.image.data);
    const resizedImage = await sharp(imageData)
      .resize({ width: 500 })
      .toBuffer();
    const file = imageData.toString("base64").substring(0, 2) + ".pdf";
    const writeStream = fs.createWriteStream(file);

    const doc = new PDFDocument();
    doc.image(resizedImage, 50, 50);
    doc.pipe(writeStream);
    doc.end();

    writeStream.on("finish", () => {
      res.download(file, "output.pdf", (err) => {
        if (err) {
          console.error("Error downloading file:", err);
          return res.status(500).send("Error downloading file.");
        }
        fs.unlinkSync(file);
      });
    });

    doc.on("error", (err) => {
      console.error("PDFKit error:", err);
      res.status(500).send("PDFKit error.");
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error.");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
