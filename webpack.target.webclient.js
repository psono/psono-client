const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const PrettierPlugin = require("prettier-webpack-plugin");
const path = require('path');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    'webclient/js/bundle.min.js': './src/js/index.js',
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
      'TARGET': JSON.stringify('WEBCLIENT'),
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
    new PrettierPlugin({
      printWidth: 160,               // Specify the length of line that the printer will wrap on.
      tabWidth: 4,                  // Specify the number of spaces per indentation-level.
      useTabs: false,               // Indent lines with tabs instead of spaces.
      semi: true,                   // Print semicolons at the ends of statements.
      encoding: 'utf-8',            // Which encoding scheme to use on files
      extensions: [ ".js", ".ts" ]  // Which file extensions to process
    }),
  ],
});
