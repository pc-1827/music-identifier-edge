const fs = require('fs');
const axios = require('axios');

async function sendDataToAPI(inputFilePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(inputFilePath, (err, data) => {
            if (err) {
                console.error('Error reading base64 text file:', err);
                reject(err);
                return;
            }
            // Assuming transferToAPI is a function that sends data to an API
            transferToAPI(data)
              .then((responseData) => {
                console.log('Data sent to API successfully.');
                resolve(responseData); // Resolve with API response data
              })
              .catch((err) => {
                console.error('Error sending data to API:', err);
                reject(err);
              });
        });
    });
}

async function transferToAPI(base64String) {
    const options = {
        method: 'POST',
        url: 'url',
        params: {
          timezone: 'timezone',
          locale: 'en-US'
        },
        headers: {
          'content-type': 'text/plain',
          'X-RapidAPI-Key': 'API-Key',
          'X-RapidAPI-Host': 'API-Host'
        },
        data: base64String
      };

      try {
          const response = await axios.request(options);
          console.log(response.data);
      } catch (error) {
          console.error(error);
      }
}


const base64InputFilePath = 'base64.txt';

sendDataToAPI(base64InputFilePath)
  .then(() => {
    console.log('Sending data to API successful.');
  })
  .catch((err) => {
    console.error('Sending data to API failed:', err);
  });
