const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {

  app.use(
    '/apis',
    createProxyMiddleware({
      target: 'https://cbell.ai/api',
      changeOrigin: true,
      pathRewrite: { '^/apis': '' },
    })
  );
};
