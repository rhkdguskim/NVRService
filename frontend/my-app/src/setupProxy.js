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

      app.use(
        createProxyMiddleware('/user', {
          target: 'http://localhost:8000/',
          changeOrigin: true,
        }),
      );

      app.use(
        createProxyMiddleware('/hls', {
          target: 'http://localhost:8000/',
          changeOrigin: true,
        }),
      );

      app.use(
        createProxyMiddleware('/system', {
          target: 'http://localhost:8000/',
          changeOrigin: true,
        }),
      );

      app.use(
        createProxyMiddleware('/playback', {
          target: 'http://localhost:8000/',
          changeOrigin: true,
        }),
      );

      app.use(
        '/data',
        createProxyMiddleware({
          target: 'ws://localhost:8000/',
          ws: true,
          changeOrigin: true,
        })
      );

      app.use(
        '/camera/ws',
        createProxyMiddleware({
          target: 'ws://localhost:8000/',
          ws: true,
          changeOrigin: true,
        })
      );
  };