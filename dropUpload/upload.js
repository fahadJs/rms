const axios = require('axios');
// const fs = require('fs');
const { Dropbox } = require('dropbox');

const REFRESH_TOKEN = '0PQ3xwMx800AAAAAAAAAATqX0Px_bWXyoe99Ta-iEwJIPBdSEBX8-vFHzb-fE4Ud';
const CLIENT_ID = '0lyn8645ccfx6z1';
const CLIENT_SECRET = 'njhia3io2eavg0x';

let accessToken = null;
let tokenExpirationTime = null;

const getAccessToken = async () => {
  try {
    if (!accessToken || Date.now() >= tokenExpirationTime) {
      const url = 'https://api.dropbox.com/oauth2/token';
      const data = new URLSearchParams();
      data.append('refresh_token', REFRESH_TOKEN);
      data.append('grant_type', 'refresh_token');
      data.append('client_id', CLIENT_ID);
      data.append('client_secret', CLIENT_SECRET);

      const response = await axios.post(url, data);
      accessToken = response.data.access_token;
      // Set the expiration time to an hour from now (Dropbox access tokens typically expire in 1 hour)
      tokenExpirationTime = Date.now() + 5000;
    }
    return accessToken;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
};

const uploadFile = async (path, content) => {
  try {
    const token = await getAccessToken();
    const dbx = new Dropbox({ accessToken: token });

    const response = await dbx.filesUpload({
      path: '/Test/' + path,
      contents: content,
      mode: { '.tag': 'add' },
    });
    console.log('File uploaded:', response);
  } catch (error) {
    console.error('Error uploading file:', error);
  }
};

// Example usage
// const filePath = '11156756.pdf';
// const fileContent = fs.readFileSync(filePath);

// uploadFile(filePath, fileContent);


module.exports = {
    uploadFile,
}