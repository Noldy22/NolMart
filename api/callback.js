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

    // 1. Create the data object safely
    const content = {
      token: access_token,
      provider: 'github'
    };

    // 2. Generate the HTML with the Safe Injection script
    // We do NOT use quotes around JSON.stringify(content) inside the script tag
    const script = `
      <html>
      <body>
      <h3 style="text-align:center; margin-top: 50px;">Login Successful!</h3>
      <p style="text-align:center;">You can close this window if it doesn't close automatically.</p>
      
      <script>
        (function() {
          // A. Safely inject the content object directly into JavaScript memory
          // This avoids the "Syntax Error" because we aren't using string manipulation
          const content = ${JSON.stringify(content)};
          
          // B. Create the exact message string Decap CMS expects
          const message = "authorizing:github:success:" + JSON.stringify(content);
          
          // C. Define the "Pulse" function to send the message repeatedly
          function sendMsg() {
            if (window.opener) {
              console.log("Sending message...", message);
              window.opener.postMessage(message, "*");
            }
          }
          
          // D. Send it every 0.2 seconds (Pulse)
          sendMsg();
          const interval = setInterval(sendMsg, 200);

          // E. Close the window after 2 seconds
          setTimeout(() => {
            clearInterval(interval);
            window.close();
          }, 2000);
        })()
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