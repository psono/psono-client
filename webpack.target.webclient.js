const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const ReplaceInFileWebpackPlugin = require('replace-in-file-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const PrettierPlugin = require("prettier-webpack-plugin");
const {InjectManifest} = require('workbox-webpack-plugin');
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
    'webclient/js/bundle.min.js': './src/js/index.js',
    'webclient/js/crypto-worker.js': './src/js/crypto-worker.js',
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
      'TARGET': JSON.stringify('webclient'),
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
    }]),
    
    // Build the service worker
    // should be last so all files are cached
    new InjectManifest({
      swSrc: './src/webclient/service-worker.js',
      swDest: './webclient/service-worker.js',
      modifyURLPrefix: {
        'webclient/': './'
      },
      compileSrc: true,
      maximumFileSizeToCacheInBytes: 20000000,
      webpackCompilationPlugins: [
        new webpack.DefinePlugin({
          'CACHE_VERSION': JSON.stringify(Date.now().toString())
        })
      ]
    })
  ],
});
