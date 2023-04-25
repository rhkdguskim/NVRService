const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = (app) => {
    app.use(
      createProxyMiddleware('/camera', {
        target: 'http://localhost:8000/',
        changeOrigin: true,
      }),
    );
    app.use(
      createProxyMiddleware('/videos', {
        target: 'http://localhost:8000/',
        changeOrigin: true,
      }),
    );

    app.use(
        createProxyMiddleware('/onvif', {
          target: 'http://localhost:8000/',
          changeOrigin: true,
        }),
      );
  };