const { merge } = require('webpack-merge');
const safari = require('./webpack.target.safari');
const prodConfig = require('./webpack.environment.prod.common');

module.exports = [merge(safari, prodConfig)];
