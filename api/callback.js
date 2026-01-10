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

    // This is the exact message format Decap CMS looks for
    const content = {
      token: access_token,
      provider: 'github'
    };

    // We use a script to post the message to the main window
    const script = `
      <script>
        (function() {
          function receiveMessage(e) {
            console.log("Sending message to opener:", e);
            // Send the message to the main window (your admin panel)
            window.opener.postMessage("authorizing:github:success:${JSON.stringify(content)}", "*");
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