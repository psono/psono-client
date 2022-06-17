const { merge } = require('webpack-merge');
//const chrome = require('./webpack.target.chrome');
//const firefox = require('./webpack.target.firefox');
const webclient = require('./webpack.target.webclient');


const developConfig = {
  mode: 'development',
  devtool: 'inline-source-map',
};

module.exports = [
  //merge(chrome, developConfig),
  //merge(firefox, developConfig),
  merge(webclient, developConfig)
];
