const axios = require('axios'); // <--- This is the safe way

module.exports = async (req, res) => {
  const { code } = req.query;
  try {
    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.OAUTH_CLIENT_ID,
      client_secret: process.env.OAUTH_CLIENT_SECRET,
      code,
    }, { headers: { Accept: 'application/json' } });

    const { access_token } = response.data;
    
    // This script closes the popup and sends the token back to the admin window
    res.send(`
      <script>
        const receiveMessage = (message) => {
          window.opener.postMessage("authorizing:github:success:{\\"token\\":\\"${access_token}\\"}", "*");
          window.close();
        }
        receiveMessage();
      </script>
    `);
  } catch (error) { 
    console.error(error); // This helps see errors in logs
    res.status(500).send("Error connecting to GitHub: " + error.message); 
  }
};