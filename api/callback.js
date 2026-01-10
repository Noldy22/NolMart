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

    // 2. Check for GitHub errors
    if (response.data.error) {
      return res.status(200).send(`<h3>GitHub Error: ${response.data.error_description}</h3>`);
    }

    const { access_token } = response.data;

    // 3. Prepare the message
    const message = {
      token: access_token,
      provider: 'github'
    };
    
    // 4. Send a visible HTML page
    const script = `
      <html>
      <body style="font-family: sans-serif; text-align: center; padding: 20px;">
        <h3>Login Process Finished</h3>
        <p>Token received: ${access_token ? "YES (starts with " + access_token.substring(0,4) + ")" : "NO"}</p>
        <p id="status">Sending to main window...</p>
        
        <script>
          const message = "authorizing:github:success:" + JSON.stringify(${JSON.stringify(message)});
          
          if (window.opener) {
             document.getElementById('status').innerText = "Found main window. Posting message...";
             window.opener.postMessage(message, "*");
             
             setTimeout(() => {
                document.getElementById('status').innerText = "Success! Closing in 1 second...";
                window.close();
             }, 1000);
          } else {
             document.getElementById('status').innerText = "ERROR: Lost connection to the main window. Please close this popup and try again.";
          }
        </script>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(script);

  } catch (error) {
    console.error(error);
    res.status(500).send("<h3>Server Error</h3><p>" + error.message + "</p>");
  }
};