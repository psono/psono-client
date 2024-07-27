const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const ReplaceInFileWebpackPlugin = require('replace-in-file-webpack-plugin');
const JsonPostProcessPlugin = require('json-post-process-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

const commit_tag = process.env.CI_COMMIT_TAG;
const commit_sha = process.env.CI_COMMIT_SHA;

let version = '1.1.0';
let hash = 'abcd1234';

if (/^v\d*\.\d*\.\d*$/.test(commit_tag)) {
  version = commit_tag.substring(1);
  hash = commit_sha.substring(0,8);
}

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    'js/bundle.min.js': './src/js/index.js',
  },
  output: {
    filename: '[name]',
    path: path.resolve(__dirname, 'build', 'firefox', 'data'),
    chunkFilename: 'js/[name].js',
    publicPath: '/data/',
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

    new JsonPostProcessPlugin({
      matchers: [{
        matcher: /^firefox\/manifest.json$/,
        action: (currentJsonContent) => ({ ...currentJsonContent, version: version })
      }]
    }),

    new ReplaceInFileWebpackPlugin([{
      dir: 'build/firefox/data',
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
