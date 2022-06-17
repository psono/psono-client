const path = require('path');

module.exports = {
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name]',
  },
  externals: {
    'crypto': 'crypto'
  },
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              publicPath: '/data',
            },
          },
        ],
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
