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

    // 1. Prepare the data
    const authBody = {
      token: access_token,
      provider: 'github'
    };

    // 2. Target YOUR specific domain
    // This tells the browser "It is safe to talk to this website"
    const origin = "https://nolmart.noldy22.com";

    const script = `
      <!DOCTYPE html>
      <html>
      <body style="background: #f0f0f0; font-family: sans-serif; text-align: center; padding-top: 50px;">
        <h3>Login Verified</h3>
        <p id="status">Connecting to Admin Panel...</p>
        
        <script>
          // SAFE DATA INJECTION
          const authBody = ${JSON.stringify(authBody)};
          const message = "authorizing:github:success:" + JSON.stringify(authBody);
          const targetOrigin = "${origin}";

          function sendHandshake() {
            if (window.opener) {
              // Try to log to the MAIN window so we know it worked
              try {
                window.opener.console.log("Popup: Handshake sent with token ending in...", authBody.token.slice(-4));
              } catch (e) {
                console.log("Could not log to main window (privacy settings).");
              }

              // Send the official message
              window.opener.postMessage(message, targetOrigin);
            } else {
              document.getElementById("status").innerText = "Error: Lost connection to Admin Panel. Please close and try again.";
            }
          }

          // Send repeatedly for 2 seconds (Pulse)
          sendHandshake();
          const timer = setInterval(sendHandshake, 500);

          setTimeout(() => {
            clearInterval(timer);
            window.close();
          }, 2000);
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