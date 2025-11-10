const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {

  app.use(
    '/apis',
    createProxyMiddleware({
      target: 'https://cbell.ai/apis',
      changeOrigin: true,
      // ws: true, 
      pathRewrite: { '^/apis': '' },
    })
  );
};

// const { createProxyMiddleware } = require('http-proxy-middleware');

// module.exports = function (app) {
//   app.use(
//     '/apis',
//     createProxyMiddleware({
//       target: 'https://cbell.ai/apis',
//       changeOrigin: true,
//       pathRewrite: { '^/apis': '' },
//       onError: (err, req, res) => {
//         console.error('Proxy Error:', err);
//         res.status(500).json({ error: 'Proxy Error', message: err.message });
//       },
//       onProxyReq: (proxyReq, req, res) => {
//         console.log('Proxying request to:', proxyReq.path);
//       },
//       onProxyRes: (proxyRes, req, res) => {
//         console.log('Proxy response status:', proxyRes.statusCode);
//         console.log('Proxy response headers:', proxyRes.headers);
//       }
//     })
//   );
// };
