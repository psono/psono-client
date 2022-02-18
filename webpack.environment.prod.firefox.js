const webpack = require('webpack');
const { merge } = require('webpack-merge');
const firefox = require('./webpack.target.firefox');
const prodConfig = require('./webpack.environment.prod.common');


module.exports = [
  merge(firefox, prodConfig),
];