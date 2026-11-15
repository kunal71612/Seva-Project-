const { app } = require('../backend/dist/index.js');

module.exports = (req, res) => {
  const originalUrl = req.headers['x-forwarded-uri'] || req.headers['x-matched-path'];
  if (originalUrl && originalUrl.startsWith('/api')) {
    req.url = originalUrl;
  }
  return app(req, res);
};
