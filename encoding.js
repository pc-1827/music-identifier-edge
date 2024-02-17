const fs = require('fs');

async function convertRawToBase64(inputFilePath, outputFilePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(inputFilePath, (err, data) => {
      if (err) {
        console.error('Error reading raw audio file:', err);
        reject(err);
        return;
      }

      const base64String = data.toString('base64');

      fs.writeFile(outputFilePath, base64String, (err) => {
        if (err) {
          console.error('Error writing base64 string to file:', err);
          reject(err);
          return;
        }

        console.log('Base64 string written to file:', outputFilePath);
        resolve();
      });
    });
  });
}

// Example usage
const inputFilePath = 'output.raw';
const base64OutputFilePath = 'base64.txt';

convertRawToBase64(inputFilePath, base64OutputFilePath)
  .then(() => {
    console.log('Conversion and writing to file successful.');
  })
  .catch((err) => {
    console.error('Conversion or writing to file failed:', err);
  });
