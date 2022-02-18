const webpack = require('webpack');
const { merge } = require('webpack-merge');
const chrome = require('./webpack.target.chrome');
const prodConfig = require('./webpack.environment.prod.common');

module.exports = [
  merge(chrome, prodConfig),
];