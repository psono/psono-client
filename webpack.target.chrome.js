const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const ReplaceInFileWebpackPlugin = require('replace-in-file-webpack-plugin');
const JsonPostProcessPlugin = require('json-post-process-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

const commit_tag = process.env.CI_COMMIT_TAG;
const commit_sha = process.env.CI_COMMIT_SHA;

let version = '1.0.0';
let hash = '00000000';

if (/^v\d*\.\d*\.\d*$/.test(commit_tag)) {
  version = commit_tag.substring(1);
  hash = commit_sha.substring(0,8);
}

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    'chrome/data/js/bundle.min.js': './src/js/index.js',
    'chrome/data/js/crypto-worker.js': './src/js/crypto-worker.js',
    'chrome/data/js/background-chrome.js': './src/js/background-chrome.js',
  },
  plugins: [
    new webpack.DefinePlugin({
      'TARGET': JSON.stringify('chrome'),
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src', 'common'),
          to: path.resolve(__dirname, 'build', 'chrome'),
          priority: 5,
        },
        {
          from: path.resolve(__dirname, 'src', 'chrome'),
          to: path.resolve(__dirname, 'build', 'chrome'),
          priority: 10,
        },
      ],
    }),
      
    new JsonPostProcessPlugin({
      matchers: [{
        matcher: /^chrome\/manifest.json$/,
        action: (currentJsonContent) => ({ ...currentJsonContent, version: version })
      }]
    }),
      
    new ReplaceInFileWebpackPlugin([{
      dir: 'build/chrome/data',
      files: ['VERSION.txt'],
      rules: [{
        search: '1.1.0',
        replace: version
      },{
        search: 'abcd1234',
        replace: hash
      }]
    }]),
  ],
});
