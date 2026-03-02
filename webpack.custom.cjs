const path = require('path');

module.exports = {
  entry: './node_modules/gameboy-emulator/src/gameboy.ts',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              compilerOptions: {
                noImplicitAny: false,
              }
            }
          }
        ],
        include: [path.resolve(__dirname, 'node_modules/gameboy-emulator/src')],
        exclude: [/\.spec\.ts$/],
      },
      {
        test: [/\.node.js$/],
        include: [ path.resolve(__dirname, './node_modules/gameboy-emulator/src')],
        use: 'raw-loader',
      },
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'node_modules/gameboy-emulator/src')
    },
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'gameboy.js',
    path: path.resolve(__dirname, 'node_modules/gameboy-emulator/dist'),
    library: {
      name: 'gameboy',
      type: 'umd'
    }
  },
};
