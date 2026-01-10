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

    // 1. Prepare data
    const authBody = {
      token: access_token,
      provider: 'github'
    };

    // 2. Generate script
    // We use "*" for the targetOrigin to bypass strict Tracking Prevention
    const script = `
      <!DOCTYPE html>
      <html>
      <body style="background: #f0f0f0; text-align: center; padding-top: 50px; font-family: sans-serif;">
        <h3>Login Verified!</h3>
        <p>Connecting to Admin Panel...</p>
        <script>
          const authBody = ${JSON.stringify(authBody)};
          const message = "authorizing:github:success:" + JSON.stringify(authBody);
          
          function send() {
            if (window.opener) {
              // The "*" is critical here to get past the browser security block
              window.opener.postMessage(message, "*");
            }
          }
          
          // Pulse the message
          send();
          setInterval(send, 500);
          
          // Close after 2 seconds
          setTimeout(() => window.close(), 10000);
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