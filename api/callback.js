const axios = require('axios');

module.exports = async (req, res) => {
  const { code } = req.query;

  try {
    // 1. Exchange the code for a token
    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.OAUTH_CLIENT_ID,
      client_secret: process.env.OAUTH_CLIENT_SECRET,
      code,
    }, { headers: { Accept: 'application/json' } });

    // 2. Check for errors from GitHub (even if status is 200)
    if (response.data.error) {
      return res.status(400).send(`Error from GitHub: ${response.data.error_description}`);
    }

    const { access_token } = response.data;

    // 3. Prepare the "Handshake" message
    const message = {
      token: access_token,
      provider: 'github'
    };

    // 4. Send the script that passes the token back to the main window
    // We use JSON.stringify to ensure the format is perfect
    const script = `
      <script>
        const message = "authorizing:github:success:" + JSON.stringify(${JSON.stringify(message)});
        window.opener.postMessage(message, "*");
        
        // Visual feedback for you
        document.body.innerHTML = "<h3>Login Successful!</h3><p>Closing in 2 seconds...</p>";
        
        setTimeout(function() {
          window.close();
        }, 2000);
      </script>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(script);

  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error: " + error.message);
  }
};