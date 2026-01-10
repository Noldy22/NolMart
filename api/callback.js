import axios from 'axios';

export default async (req, res) => {
  const { code } = req.query;
  try {
    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.OAUTH_CLIENT_ID,
      client_secret: process.env.OAUTH_CLIENT_SECRET,
      code,
    }, { headers: { Accept: 'application/json' } });

    const { access_token } = response.data;
    res.send(`
      <script>
        window.opener.postMessage("authorizing:github:success:{"token":"${access_token}"}", "*");
        window.close();
      </script>
    `);
  } catch (error) { res.status(500).send(error.message); }
};