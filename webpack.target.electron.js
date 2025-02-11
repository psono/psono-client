const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const ReplaceInFileWebpackPlugin = require('replace-in-file-webpack-plugin');
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
    'js/crypto-worker.js': './src/js/crypto-worker.js',
  },
  output: {
    filename: '[name]',
    path: path.resolve(__dirname, 'build', 'electron'),
    chunkFilename: 'js/[name].js',
    publicPath: '/',
  },
  plugins: [
    new webpack.DefinePlugin({
      'TARGET': JSON.stringify('electron'),
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src', 'common', 'data'),
          to: path.resolve(__dirname, 'build', 'electron'),
          priority: 5,
        },
        {
          from: path.resolve(__dirname, 'src', 'electron', 'data'),
          to: path.resolve(__dirname, 'build', 'electron'),
          priority: 10,
        },
      ],
    }),

    new ReplaceInFileWebpackPlugin([{
      dir: 'build/electron',
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
