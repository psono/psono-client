const webpack = require('webpack');
const { merge } = require('webpack-merge');
const prodConfig = require('./webpack.environment.prod.common');
const webclient = require('./webpack.target.webclient');
const ReplaceInFileWebpackPlugin = require('replace-in-file-webpack-plugin');
const {InjectManifest} = require('workbox-webpack-plugin');

const commit_tag = process.env.CI_COMMIT_TAG;
const commit_sha = process.env.CI_COMMIT_SHA;

let version = '1.1.0';
let hash = 'abcd1234';

if (/^v\d*\.\d*\.\d*$/.test(commit_tag)) {
  version = commit_tag.substring(1);
  hash = commit_sha.substring(0,8);
}

module.exports = () => {
  const config = merge(webclient, prodConfig);
  config['plugins'].push(
      new ReplaceInFileWebpackPlugin([{
        dir: 'build/webclient',
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
      // Build the service worker
      // should be last so all files are cached
      new InjectManifest({
        swSrc: './src/webclient/service-worker.js',
        swDest: './webclient/service-worker.js',
        modifyURLPrefix: {
          'webclient/': './'
        },
        compileSrc: true,
        maximumFileSizeToCacheInBytes: 30000000,
        webpackCompilationPlugins: [
          new webpack.DefinePlugin({
            'CACHE_VERSION': JSON.stringify(Date.now().toString())
          })
        ]
      }),
  )
  return config
};