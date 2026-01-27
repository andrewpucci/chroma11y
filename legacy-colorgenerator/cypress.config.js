const { defineConfig } = require('cypress')
const fs = require('fs')
const path = require('path')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3001',
    setupNodeEvents(on, config) {
      // Add custom task for logging
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        logToFile({ filePath, content }) {
          const dir = path.dirname(filePath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.appendFileSync(filePath, content + '\n');
          return null;
        }
      });
      
      // Server is managed by the test:ci script
      return config;
    },
    // Viewport settings
    viewportWidth: 1280,
    viewportHeight: 800,
    // File paths
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.js',
    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 60000,
    // Retries
    retries: {
      runMode: 2,
      openMode: 0
    },
    // Video settings
    video: true,
    videoCompression: 32,
    // Screenshots
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/screenshots',
    // Downloads
    downloadsFolder: 'cypress/downloads',
    // Environment variables
    env: {
      baseUrl: 'http://localhost:3001'
    },
    // Experimental features
    experimentalMemoryManagement: true,
    experimentalStudio: true,
    // Performance
    numTestsKeptInMemory: 5,
    // Browser settings
    chromeWebSecurity: false,
    // Other settings
    watchForFileChanges: false
  },
  // Component testing is not configured as we're using a static server
});
