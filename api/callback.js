const axios = require('axios');

module.exports = async (req, res) => {
  const { code } = req.query;

  try {
    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.OAUTH_CLIENT_ID,
      client_secret: process.env.OAUTH_CLIENT_SECRET,
      code,
    }, { headers: { Accept: 'application/json' } });

    const { access_token } = response.data;

    // We manually construct the JSON string to be 100% safe from syntax errors
    const content = `{"token":"${access_token}","provider":"github"}`;
    const message = `authorizing:github:success:${content}`;

    const script = `
      <html>
      <body>
      <h3>Login Successful</h3>
      <p>Please wait while we close this window...</p>
      <script>
        // 1. Define the send function
        function sendCredentials() {
          if (window.opener) {
            // Try to log to the main window's console so you can see it
            try { window.opener.console.log("Popup: Sending auth message..."); } catch(e) {}
            
            // Send the message
            window.opener.postMessage("${message}", "*");
          }
        }

        // 2. Pulse: Send it immediately, then again every 500ms
        // This ensures the main window definitely gets it
        sendCredentials();
        setInterval(sendCredentials, 500);

        // 3. Close automatically after 3 seconds (giving it plenty of time)
        setTimeout(() => {
          window.close();
        }, 3000);
      </script>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(script);

  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error: " + error.message);
  }
};