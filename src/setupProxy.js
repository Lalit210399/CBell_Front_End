const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {

  app.use(
    '/apis',
    createProxyMiddleware({
      target: 'https://cbell.ai/apis',
      changeOrigin: true,
      pathRewrite: { '^/apis': '' },
    })
  );
};
