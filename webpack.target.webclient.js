const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');


module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    'js/bundle.min.js': './src/js/index.js',
    'js/crypto-worker.js': './src/js/crypto-worker.js',
  },
  output: {
    filename: '[name]',
    path: path.resolve(__dirname, 'build', 'webclient'),
    chunkFilename: 'js/[name].js',
    publicPath: '/',
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'src', 'common', 'data'),
    },
    client: {
      logging: 'verbose',
    },
    proxy: {
      '/server': {
        target: 'http://localhost:8001',
        pathRewrite: { '^/server': '' },
      },
    },
    allowedHosts: 'all',
    compress: true,
    host: '0.0.0.0',
    port: 9000,
  },
  plugins: [
    new webpack.DefinePlugin({
      'TARGET': JSON.stringify('webclient'),
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src', 'common', 'data'),
          to: path.resolve(__dirname, 'build', 'webclient'),
          priority: 5,
        },
        {
          from: path.resolve(__dirname, 'src', 'webclient', 'data'),
          to: path.resolve(__dirname, 'build', 'webclient'),
          priority: 10,
        },
      ],
    }),
  ],
});
