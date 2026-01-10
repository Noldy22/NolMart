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

    const content = {
      token: access_token,
      provider: 'github'
    };

    // FIX: We inject the object safely, then create the string in the browser
    const script = `
      <script>
        (function() {
          function receiveMessage() {
            try {
              // 1. We inject the content object directly into the JS
              var content = ${JSON.stringify(content)};
              
              // 2. We combine it safely into the string Decap CMS expects
              var message = "authorizing:github:success:" + JSON.stringify(content);
              
              // 3. Send it to the main window
              if (window.opener) {
                window.opener.postMessage(message, "*");
                window.close();
              } else {
                 document.body.innerHTML = "Error: Could not find main window.";
              }
            } catch (e) {
              console.error("Login script error:", e);
            }
          }
          receiveMessage();
        })()
      </script>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(script);

  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error: " + error.message);
  }
};