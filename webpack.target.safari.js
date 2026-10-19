const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

const tag = process.env.CI_COMMIT_TAG || '';
const version = /^v\d+\.\d+\.\d+$/.test(tag) ? tag.substring(1) : '1.0.0';
const hash = (process.env.CI_COMMIT_SHA || '00000000').substring(0, 8);

module.exports = merge(common, {
  entry: {
    'js/bundle.min.js': './src/js/index.tsx',
    'js/crypto-worker.js': './src/js/crypto-worker.ts',
  },
  output: {
    filename: '[name]',
    path: path.resolve(__dirname, 'build', 'safari', 'data'),
    chunkFilename: 'js/[name].js',
    publicPath: '/data/',
    clean: true,
  },
  plugins: [
    new webpack.DefinePlugin({ TARGET: JSON.stringify('safari') }),
    new CopyPlugin({ patterns: [
      {
        from: path.resolve(__dirname, 'src', 'common'),
        to: path.resolve(__dirname, 'build', 'safari'),
        globOptions: { ignore: ['**/VERSION.txt', '**/*.test.js'] },
        priority: 5,
      },
      {
        from: path.resolve(__dirname, 'src', 'firefox'),
        to: path.resolve(__dirname, 'build', 'safari'),
        globOptions: { ignore: ['**/manifest.json', '**/managed_storage.json'] },
        priority: 10,
      },
      {
        from: path.resolve(__dirname, 'src', 'safari', 'manifest.json'),
        to: path.resolve(__dirname, 'build', 'safari', 'manifest.json'),
        transform: content => JSON.stringify({
          ...JSON.parse(content.toString()), version,
        }, null, 2),
      },
      {
        from: path.resolve(__dirname, 'src', 'common', 'data', 'VERSION.txt'),
        to: 'VERSION.txt',
        transform: content => content.toString().replace('1.1.0', version).replace('abcd1234', hash),
      },
    ] }),
  ],
});
