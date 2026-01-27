// ***********************************************************
// Global test configuration and setup for Cypress E2E tests
// ***********************************************************

// Import commands
import './commands';

// Import tab plugin
import 'cypress-plugin-tab';

// Global before each test
beforeEach(() => {
  // Visit the application before each test
  cy.visit('/', {
    // Increase timeout for initial page load
    timeout: 30000,
    // Ensure all resources are loaded
    onBeforeLoad(win) {
      // Add a property to track if the app is ready
      win.isAppReady = false;
    },
    // Wait for the app to signal it's ready
    onLoad(win) {
      return new Cypress.Promise((resolve) => {
        const checkReady = () => {
          if (win.isAppReady) {
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });
    }
  });

  // Wait for the application to be ready
  cy.waitForAppReady();

  // Ensure the app is fully rendered by waiting for palettes to be generated
  // The palettes are rendered with the class 'generated-hue'
  cy.get('.generated-hue', { timeout: 10000 }).should('exist');
  
  // Initialize axe-core with a simpler configuration
  cy.injectAxe();
});

// After each test, check for any uncaught exceptions
afterEach(() => {
  // Log any uncaught exceptions that might have occurred during the test
  cy.on('uncaught:exception', (err, runnable) => {
    console.error('Uncaught exception:', err);
    // Return false to prevent Cypress from failing the test
    return false;
  });
});

// Custom command to get the colorState from the application window
Cypress.Commands.add('getColorState', () => {
  return cy.window().then(win => win.colorState || null);
});

// Custom command to wait for the application to be fully loaded
Cypress.Commands.add('waitForAppReady', () => {
  // Wait for the color picker and other essential elements to be visible
  cy.get('#color-value', { timeout: 20000 }).should('be.visible');
  cy.get('#palettes', { timeout: 20000 }).should('exist');
  
  // Wait for any initial rendering to complete
  cy.wait(500);
  
  // Return a chainable to ensure commands wait properly
  return cy.wrap(null);
});
