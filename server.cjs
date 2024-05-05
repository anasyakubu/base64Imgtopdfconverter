const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const crypto = require('crypto');
const sharp = require('sharp');

const app = express();
const port = 3000;

app.use(fileUpload());
app.use(express.static('public'));

function generateHash(data) {
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}

function generateFilename(base64String) {
  const hash = generateHash(base64String);
  return hash + '.pdf';
}

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/upload', async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).send('No image uploaded.');
    }

    const imageData = Buffer.from(req.files.image.data);
    const base64String = imageData.toString('base64');
    const resizedImage = await sharp(imageData).resize({ width: 500 }).toBuffer();

    const doc = new PDFDocument();
    const filename = generateFilename(base64String);
    const writeStream = fs.createWriteStream(filename);

    doc.image(resizedImage, 50, 50);

    doc.pipe(writeStream);
    doc.end();

    writeStream.on('finish', () => {
      res.download(filename, 'output.pdf', (err) => {
        if (err) {
          console.error('Error downloading file:', err);
          return res.status(500).send('Error downloading file.');
        }
        fs.unlinkSync(filename);
      });
    });

    doc.on('error', (err) => {
      console.error('PDFKit error:', err);
      res.status(500).send('PDFKit error.');
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error.');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
