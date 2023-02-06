const webpack = require('webpack');
const { merge } = require('webpack-merge');
const prodConfig = require('./webpack.environment.prod.common');
const electron = require('./webpack.target.electron');
const ReplaceInFileWebpackPlugin = require('replace-in-file-webpack-plugin');

const commit_tag = process.env.CI_COMMIT_TAG;
const commit_sha = process.env.CI_COMMIT_SHA;

let version = '1.1.0';
let hash = 'abcd1234';

if (/^v\d*\.\d*\.\d*$/.test(commit_tag)) {
  version = commit_tag.substring(1);
  hash = commit_sha.substring(0,8);
}

module.exports = () => {
  const config = merge(electron, prodConfig);
  config['plugins'].push(
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
      }])
  )
  config['plugins'].push(
      new ReplaceInFileWebpackPlugin([{
        dir: 'src/electron',
        files: ['package.json'],
        rules: [{
          search: '"version": "1.1.0"',
          replace: '"version": "' + version + '"'
        }]
      }])
  )
  return config
};