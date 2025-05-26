const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {

  app.use(
    '/apis',
    createProxyMiddleware({
      target: 'http://192.168.1.25:5000',
      changeOrigin: true,
      pathRewrite: { '^/apis': '' },
    })
  );
};
