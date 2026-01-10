module.exports = (req, res) => {
  const { OAUTH_CLIENT_ID } = process.env;
  const url = `https://github.com/login/oauth/authorize?client_id=${OAUTH_CLIENT_ID}&scope=repo,user`;
  res.redirect(url);
};