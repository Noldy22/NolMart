export default (req, res) => {
  const { GITHUB_CLIENT_ID } = process.env;
  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.OAUTH_CLIENT_ID}&scope=repo,user`;
  res.redirect(url);
};