const path = require('path');

module.exports = {
  entry: './lambda.js',
  target: 'node',
  mode: 'production',
  optimization: {
    minimize: false
  },
  performance: {
    hints: false
  },
  output: {
    libraryTarget: 'commonjs2',
    path: path.resolve(__dirname, '.webpack'),
    filename: 'lambda.js'
  }
};