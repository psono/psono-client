const path = require('path');

module.exports = {
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name]',
  },
  resolve: {
    alias: {
      'react/jsx-runtime': require.resolve('react/jsx-runtime'),
      'react/jsx-dev-runtime': require.resolve('react/jsx-dev-runtime'),
    },
  },
  externals: {
    'crypto': 'crypto'
  },
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif)$/i,
        type: 'asset/resource'
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  },
};
