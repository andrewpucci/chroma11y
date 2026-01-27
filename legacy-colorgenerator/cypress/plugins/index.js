// ***********************************************************
// Cypress plugin configuration
// ***********************************************************

const { startDevServer } = require('@cypress/webpack-dev-server');
const webpackConfig = require('../../webpack.config');

module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  
  // Start the webpack dev server for component testing
  on('dev-server:start', async (options) => {
    return startDevServer({
      options,
      webpackConfig,
    });
  });

  // Add custom task for logging
  on('task', {
    log(message) {
      console.log(message);
      return null;
    },
    table(message) {
      console.table(message);
      return null;
    },
  });

  return config;
};
