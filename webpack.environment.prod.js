const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const { merge } = require('webpack-merge');
const chrome = require('./webpack.target.chrome');
const firefox = require('./webpack.target.firefox');
const webclient = require('./webpack.target.webclient');

const prodConfig = {
  mode: 'production',
  devtool: 'source-map',
  plugins: [
  ],
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
};

module.exports = [
  merge(chrome, prodConfig),
  merge(firefox, prodConfig),
  merge(webclient, prodConfig)
];