const path = require('path');

module.exports = {
  entry: './offscreen.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
};
