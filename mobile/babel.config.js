module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // ADD THIS PLUGINS ARRAY
  plugins: [
    'module:react-native-dotenv',
  ],
  env: {
    production: {
      plugins: ['react-native-paper/babel'],
    },
  },
};