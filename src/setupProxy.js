const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {

  app.use(
    '/apis',
    createProxyMiddleware({
      target: 'https://devoted-mole-broadly.ngrok-free.app',
      changeOrigin: true,
      pathRewrite: { '^/apis': '' },
    })
  );
};
