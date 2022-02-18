const webpack = require('webpack');
const { merge } = require('webpack-merge');
const chrome = require('./webpack.target.chrome');
const firefox = require('./webpack.target.firefox');
const webclient = require('./webpack.target.webclient');
const prodConfig = require('./webpack.environment.prod.common');

module.exports = [
  merge(chrome, prodConfig),
  merge(firefox, prodConfig),
  merge(webclient, prodConfig)
];