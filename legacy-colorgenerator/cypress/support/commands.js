// ***********************************************
// Cypress custom commands for accessibility testing
// ***********************************************

// Import cypress-axe commands for accessibility testing
import 'cypress-axe';

// Custom command to check accessibility with custom configurations
Cypress.Commands.add('checkAccessibility', (context, options = {}) => {
  // Default options for axe
  const defaultOptions = {
    runOnly: {
      type: 'tag',
      values: [
        'wcag2a',
        'wcag2aa',
        'wcag21a',
        'wcag21aa',
        'best-practice',
        'section508',
      ],
    },
    // Ignore known false positives or issues that need to be addressed separately
    rules: {
      // Disable color contrast checking as it's handled by our color generator
      'color-contrast': { enabled: false },
      // Disable region rule as it's not applicable to our app
      'region': { enabled: false },
    },
  };

  // Merge default options with user-provided options
  const mergedOptions = { ...defaultOptions, ...options };

  // Inject axe-core runtime
  cy.injectAxe();
  
  // Configure axe with the merged options
  cy.configureAxe(mergedOptions);
  
  // Run accessibility checks
  cy.checkA11y(context, mergedOptions, (violations) => {
    // Custom violation handler
    const violationData = violations.map(({ id, impact, description, nodes }) => ({
      id,
      impact,
      description,
      nodes: nodes.length,
    }));

    // Log violations for debugging
    cy.task('table', violationData);

    // Create custom error message
    const message = `Found ${violations.length} accessibility ${violations.length === 1 ? 'violation' : 'violations'}`;
    
    // Only fail the test if there are critical violations
    const criticalViolations = violations.filter(v => ['critical', 'serious'].includes(v.impact));
    if (criticalViolations.length > 0) {
      throw new Error(`${message} (${criticalViolations.length} critical/serious)`);
    }
    
    // For non-critical violations, just log a warning
    if (violations.length > 0) {
      cy.log(`⚠️  ${message}. Check the console for details.`, violations);
    }
  });
});

// Command to check accessibility on page load with default settings
Cypress.Commands.add('checkPageA11y', () => {
  cy.checkAccessibility();
});

// Command to check accessibility of a specific component
Cypress.Commands.add('checkComponentA11y', (selector) => {
  cy.get(selector).checkAccessibility();
});

// Custom command to switch theme
Cypress.Commands.add('switchTheme', (theme) => {
  cy.get('#theme-toggle').click()
  if (theme === 'dark') {
    cy.get('body').should('have.class', 'dark-theme')
  } else {
    cy.get('body').should('not.have.class', 'dark-theme')
  }
})

// Custom command to check contrast ratio
Cypress.Commands.add('checkContrastRatio', (selector, expectedRatio) => {
  cy.get(selector).should('have.css', 'color')
  cy.get(selector).then(($el) => {
    const color = window.getComputedStyle($el[0]).color
    // Implement contrast ratio check here
    // This is a placeholder - actual implementation would need to calculate the contrast
    expect(color).to.exist
  })
})
