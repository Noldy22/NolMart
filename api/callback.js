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

    const authBody = {
      token: access_token,
      provider: 'github'
    };

    const script = `
      <!DOCTYPE html>
      <html>
      <body style="background: #f0f0f0; text-align: center; padding-top: 50px; font-family: sans-serif;">
        <h3>Login Verified!</h3>
        <p>Sending handshake to Admin Panel...</p>
        <script>
          const authBody = ${JSON.stringify(authBody)};
          const message = "authorizing:github:success:" + JSON.stringify(authBody);
          
          function send() {
            if (window.opener) {
              // LOGGING ADDED BACK: Look for this in your console!
              try { window.opener.console.log("Popup: Handshake attempting to send..."); } catch(e) {}
              
              // Send with wildcard to ensure delivery
              window.opener.postMessage(message, "*");
            }
          }
          
          // Send repeatedly
          send();
          setInterval(send, 1000);
          
          // Keep open longer (5 seconds) to ensure connection
          setTimeout(() => window.close(), 5000);
        </script>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(script);

  } catch (error) {
    res.status(500).send("Error: " + error.message);
  }
};