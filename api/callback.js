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

    // 1. Create the content object
    const content = {
      token: access_token,
      provider: 'github'
    };

    // 2. Generate the HTML script
    // Note: We use a simplified variable assignment that cannot cause syntax errors
    const script = `
      <!DOCTYPE html>
      <html>
      <body style="background: #f9f9f9; font-family: sans-serif; text-align: center; padding-top: 50px;">
        <h3>Login Successful!</h3>
        <p>Connecting to Admin Panel...</p>
        <script>
          // SAFE DATA INJECTION
          // This line allows the browser to read the object natively
          const content = ${JSON.stringify(content)};
          
          // CONSTRUCT MESSAGE
          const message = "authorizing:github:success:" + JSON.stringify(content);
          
          // SEND TO OPENER (The Admin Window)
          function send() {
            if (window.opener) {
              console.log("Sending credential message...");
              window.opener.postMessage(message, "*");
            }
          }
          
          // PULSE: Send repeatedly for 3 seconds to ensure it is received
          send();
          const timer = setInterval(send, 500);
          
          // CLOSE
          setTimeout(() => {
            clearInterval(timer);
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