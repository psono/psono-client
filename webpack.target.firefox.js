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
    'firefox/data/js/bundle.min.js': './src/js/index.js',
    'firefox/data/js/crypto-worker.js': './src/js/crypto-worker.js',
  },
  plugins: [
    new webpack.DefinePlugin({
      'TARGET': JSON.stringify('firefox'),
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src', 'common'),
          to: path.resolve(__dirname, 'build', 'firefox'),
          priority: 5,
        },
        {
          from: path.resolve(__dirname, 'src', 'firefox'),
          to: path.resolve(__dirname, 'build', 'firefox'),
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
