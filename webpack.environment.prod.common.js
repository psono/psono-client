const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  plugins: [
  ],
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
};