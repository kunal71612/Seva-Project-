const { app } = require('../backend/dist/index.js');

module.exports = (req, res) => {
  const originalUrl = req.headers['x-forwarded-uri'] || req.headers['x-matched-path'];
  if (originalUrl && originalUrl.startsWith('/api')) {
    req.url = originalUrl;
  } else if (req.query && req.query.all) {
    const slug = Array.isArray(req.query.all) ? req.query.all.join('/') : req.query.all;
    req.url = `/api/${slug}`;
  }
  return app(req, res);
};
