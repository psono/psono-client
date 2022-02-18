const webpack = require('webpack');
const { merge } = require('webpack-merge');
const prodConfig = require('./webpack.environment.prod.common');
const webclient = require('./webpack.target.webclient');

module.exports = [
  merge(webclient, prodConfig)
];