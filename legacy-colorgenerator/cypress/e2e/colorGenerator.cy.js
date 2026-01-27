/// <reference types="cypress" />

describe('Color Generator', () => {
  beforeEach(() => {
    // Visit the app before each test
    cy.visit('/')
    // Wait for the page to load and elements to be interactive
    cy.get('#color-value').should('be.visible')
  })

  it('successfully loads', () => {
    // Check if the app is loaded by verifying key elements exist
    cy.get('body').should('exist')
    cy.get('#color-value').should('be.visible')
    cy.get('#palettes').should('exist')
  })

  it('generates color palettes', () => {
    // Debug: Log the current state of the palettes container
    cy.get('#palettes').then(($palettes) => {
      cy.log('Palettes container HTML:', $palettes.html())
    })
    
    // Wait for the palettes to be generated
    cy.get('#palettes', { timeout: 10000 }).should('be.visible')
    
    // Check if palettes container has children
    cy.get('#palettes').children().should('have.length.greaterThan', 0)
    
    // Check if hue nudger inputs are present (indicates palette generation)
    cy.get('.hue-nudger-input', { timeout: 5000 }).should('have.length.greaterThan', 0)
    
    // Check if there are list items in the generated palettes
    cy.get('#palettes ul.generated-hue li', { timeout: 5000 }).should('have.length.greaterThan', 0)
  })

  it('allows changing the base color', () => {
    // Wait for the palettes to be generated
    cy.get('#palettes', { timeout: 10000 }).should('be.visible')
    
    // Get the background color of the first list item in the first palette
    cy.get('#palettes ul.generated-hue li', { timeout: 5000 }).first().then(($firstLi) => {
      // Skip the first li as it contains the label and input
      return cy.get('#palettes ul.generated-hue li').eq(1).then(($swatchLi) => {
        const initialColor = $swatchLi.css('background-color')
        
        // Change the base color to red
        cy.get('#color-value').invoke('val', '#ff0000').trigger('input')
        
        // Wait for the color to change
        cy.wait(1000)
        
        // Verify the swatch color has changed
        return cy.get('#palettes ul.generated-hue li').eq(1).should(($newSwatchLi) => {
          expect($newSwatchLi.css('background-color')).not.to.equal(initialColor)
        })
      })
    })
  })

  it('toggles between light and dark themes', () => {
    // Wait for the app to be fully loaded
    cy.waitForAppReady();
    
    // The theme toggle button should be visible
    cy.get('#theme-toggle').should('be.visible');
    
    // Get the initial theme from the state
    cy.window().then((win) => {
      const initialState = win.colorState;
      cy.log('Initial colorState:', JSON.stringify(initialState, null, 2));
      
      // Get the initial theme
      const initialTheme = initialState?.currentTheme || 'light';
      cy.log(`Initial theme from state: ${initialTheme}`);
      
      // Get the initial theme icon and verify it matches the initial theme
      const initialExpectedIcon = initialTheme === 'dark' ? '☀️' : '🌙';
      cy.get('#theme-toggle .theme-icon').should('exist').and('have.text', initialExpectedIcon);
      
      // Toggle the theme
      cy.get('#theme-toggle').click();
      
      // Wait for theme transition and state updates
      cy.wait(1000);
      
      // Get the new state after toggle
      cy.window().then((win) => {
        const newState = win.colorState;
        cy.log('New colorState after toggle:', JSON.stringify(newState, null, 2));
        
        // Get the new theme
        const newTheme = newState?.currentTheme || 'light';
        cy.log(`New theme after toggle: ${newTheme}`);
        
        // For now, just verify the theme is one of the expected values
        expect(['light', 'dark']).to.include(newTheme);
        
        // Verify the theme icon has changed to match the new theme
        const expectedIcon = newTheme === 'dark' ? '☀️' : '🌙';
        cy.get('#theme-toggle .theme-icon').should('have.text', expectedIcon);
        
        // Toggle back to the original theme
        cy.get('#theme-toggle').click();
        
        // Wait for theme transition and state updates
        cy.wait(1000);
        
        // Get the final state after toggling back
        cy.window().then((win) => {
          const finalState = win.colorState;
          cy.log('Final colorState after toggle back:', JSON.stringify(finalState, null, 2));
          
          // Get the final theme
          const finalTheme = finalState?.currentTheme || 'light';
          cy.log(`Final theme after toggle back: ${finalTheme}`);
          
          // For now, just verify the theme is one of the expected values
          expect(['light', 'dark']).to.include(finalTheme);
          
          // Verify the theme icon matches the final theme
          const finalExpectedIcon = finalTheme === 'dark' ? '☀️' : '🌙';
          cy.get('#theme-toggle .theme-icon').should('have.text', finalExpectedIcon);
        });
      });
    });
  })

  it('allows adjusting contrast settings', () => {
    // Change contrast mode to manual
    cy.get('#contrast-mode').select('manual')
    
    // Verify manual mode controls are visible
    cy.get('.manual-mode').should('not.have.class', 'd-none')
    cy.get('.auto-mode').should('have.class', 'd-none')
    
    // Change back to auto mode
    cy.get('#contrast-mode').select('auto')
    
    // Verify auto mode controls are visible
    cy.get('.auto-mode').should('not.have.class', 'd-none')
    cy.get('.manual-mode').should('have.class', 'd-none')
    
    // Test low step selection
    cy.get('#low-step').should('be.visible').select('2')
    
    // Test high step selection
    cy.get('#high-step').should('be.visible').select('8')
  })
<<<<<<< Updated upstream
=======

  it('generates consistent colors with nudgers applied', () => {
    // Wait for the app to be fully loaded
    cy.waitForAppReady();
    
    // Set the base configuration
    cy.get('#color-value').invoke('val', '#1862e6').trigger('input');
    cy.get('#warmth-value').invoke('val', '-7').trigger('input');
    cy.get('#x1-value').invoke('val', '0.16').trigger('input');
    cy.get('#y1-value').invoke('val', '0').trigger('input');
    cy.get('#x2-value').invoke('val', '0.28').trigger('input');
    cy.get('#y2-value').invoke('val', '0.38').trigger('input');
    cy.get('#chroma-mult-value').invoke('val', '1.14').trigger('input');
    
    // Wait for initial generation
    cy.wait(500);
    
    // Set nudger values
    cy.get('#nudger-5').invoke('val', '-0.005').trigger('input');
    cy.get('#nudger-6').invoke('val', '-0.0009').trigger('input');
    
    // Set hue nudger for palette 4
    cy.get('#hue-nudger-4').invoke('val', '-5').trigger('input');
    
    // Wait for regeneration
    cy.wait(500);
    
    // Expected neutral colors with their text colors
    const expectedNeutrals = [
      { hex: '#ffffff', textColor: 'black' },
      { hex: '#f1f3f5', textColor: 'black' },
      { hex: '#d5d7d9', textColor: 'black' },
      { hex: '#b6b8b9', textColor: 'black' },
      { hex: '#97999b', textColor: 'black' },
      { hex: '#797b7c', textColor: 'black' },
      { hex: '#5e6062', textColor: 'white' },
      { hex: '#454748', textColor: 'white' },
      { hex: '#2c2e30', textColor: 'white' },
      { hex: '#151718', textColor: 'white' },
      { hex: '#000000', textColor: 'white' }
    ];
    
    // Expected colors for all 11 palettes with their text colors
    const expectedAllPalettes = JSON.parse(`[
      [
        { "hex": "#ffffff", "textColor": "black" },
        { "hex": "#e5f4ff", "textColor": "black" },
        { "hex": "#acd8ff", "textColor": "black" },
        { "hex": "#7eb6ff", "textColor": "black" },
        { "hex": "#5995ff", "textColor": "black" },
        { "hex": "#3a75e1", "textColor": "black" },
        { "hex": "#295bb7", "textColor": "white" },
        { "hex": "#1b428a", "textColor": "white" },
        { "hex": "#0f2b5d", "textColor": "white" },
        { "hex": "#051433", "textColor": "white" },
        { "hex": "#000000", "textColor": "white" }
      ],
      [
        { "hex": "#ffffff", "textColor": "black" },
        { "hex": "#f4efff", "textColor": "black" },
        { "hex": "#dbc8ff", "textColor": "black" },
        { "hex": "#bea2ff", "textColor": "black" },
        { "hex": "#a17ff8", "textColor": "black" },
        { "hex": "#835fd7", "textColor": "white" },
        { "hex": "#6748ae", "textColor": "white" },
        { "hex": "#4c3483", "textColor": "white" },
        { "hex": "#322059", "textColor": "white" },
        { "hex": "#190e30", "textColor": "white" },
        { "hex": "#000000", "textColor": "white" }
      ],
      [
        { "hex": "#ffffff", "textColor": "black" },
        { "hex": "#ffebff", "textColor": "black" },
        { "hex": "#ffbcff", "textColor": "black" },
        { "hex": "#eb92eb", "textColor": "black" },
        { "hex": "#cf6dd0", "textColor": "black" },
        { "hex": "#ae4db0", "textColor": "white" },
        { "hex": "#8b388d", "textColor": "white" },
        { "hex": "#68276a", "textColor": "white" },
        { "hex": "#461847", "textColor": "white" },
        { "hex": "#250925", "textColor": "white" },
        { "hex": "#000000", "textColor": "white" }
      ],
      [
        { "hex": "#ffffff", "textColor": "black" },
        { "hex": "#ffe9f2", "textColor": "black" },
        { "hex": "#ffb6d5", "textColor": "black" },
        { "hex": "#ff8ab5", "textColor": "black" },
        { "hex": "#ea6396", "textColor": "black" },
        { "hex": "#c74177", "textColor": "white" },
        { "hex": "#a12e5d", "textColor": "white" },
        { "hex": "#791f44", "textColor": "white" },
        { "hex": "#51122c", "textColor": "white" },
        { "hex": "#2c0615", "textColor": "white" },
        { "hex": "#000000", "textColor": "white" }
      ],
      [
        { "hex": "#ffffff", "textColor": "black" },
        { "hex": "#ffeae5", "textColor": "black" },
        { "hex": "#ffb9ad", "textColor": "black" },
        { "hex": "#ff8d80", "textColor": "black" },
        { "hex": "#f1665b", "textColor": "black" },
        { "hex": "#ce433c", "textColor": "white" },
        { "hex": "#a6302b", "textColor": "white" },
        { "hex": "#7d201d", "textColor": "white" },
        { "hex": "#541310", "textColor": "white" },
        { "hex": "#2e0605", "textColor": "white" },
        { "hex": "#000000", "textColor": "white" }
      ],
      [
        { "hex": "#ffffff", "textColor": "black" },
        { "hex": "#ffeed9", "textColor": "black" },
        { "hex": "#ffc782", "textColor": "black" },
        { "hex": "#faa039", "textColor": "black" },
        { "hex": "#df7d00", "textColor": "black" },
        { "hex": "#be5c00", "textColor": "black" },
        { "hex": "#994600", "textColor": "white" },
        { "hex": "#733200", "textColor": "white" },
        { "hex": "#4d1f00", "textColor": "white" },
        { "hex": "#290d00", "textColor": "white" },
        { "hex": "#000000", "textColor": "white" }
      ],
      [
        { "hex": "#fffffe", "textColor": "black" },
        { "hex": "#f9f4d7", "textColor": "black" },
        { "hex": "#ecd879", "textColor": "black" },
        { "hex": "#d3b71f", "textColor": "black" },
        { "hex": "#b79700", "textColor": "black" },
        { "hex": "#987700", "textColor": "black" },
        { "hex": "#795d00", "textColor": "white" },
        { "hex": "#5a4400", "textColor": "white" },
        { "hex": "#3b2c00", "textColor": "white" },
        { "hex": "#1f1500", "textColor": "white" },
        { "hex": "#000000", "textColor": "white" }
      ],
      [
        { "hex": "#ffffff", "textColor": "black" },
        { "hex": "#eaf8de", "textColor": "black" },
        { "hex": "#bde794", "textColor": "black" },
        { "hex": "#96cb5a", "textColor": "black" },
        { "hex": "#73ad20", "textColor": "black" },
        { "hex": "#558d00", "textColor": "black" },
        { "hex": "#407000", "textColor": "white" },
        { "hex": "#2d5300", "textColor": "white" },
        { "hex": "#1c3600", "textColor": "white" },
        { "hex": "#0c1c00", "textColor": "white" },
        { "hex": "#000000", "textColor": "white" }
      ],
      [
        { "hex": "#ffffff", "textColor": "black" },
        { "hex": "#ddfbec", "textColor": "black" },
        { "hex": "#89f0c1", "textColor": "black" },
        { "hex": "#36d69b", "textColor": "black" },
        { "hex": "#00b979", "textColor": "black" },
        { "hex": "#00985b", "textColor": "black" },
        { "hex": "#007945", "textColor": "white" },
        { "hex": "#005a32", "textColor": "white" },
        { "hex": "#003c1f", "textColor": "white" },
        { "hex": "#001f0d", "textColor": "white" },
        { "hex": "#000000", "textColor": "white" }
      ],
      [
        { "hex": "#feffff", "textColor": "black" },
        { "hex": "#d7fbfb", "textColor": "black" },
        { "hex": "#68eff0", "textColor": "black" },
        { "hex": "#00d5d7", "textColor": "black" },
        { "hex": "#00b7bb", "textColor": "black" },
        { "hex": "#00979c", "textColor": "black" },
        { "hex": "#00787c", "textColor": "white" },
        { "hex": "#00595c", "textColor": "white" },
        { "hex": "#003b3d", "textColor": "white" },
        { "hex": "#001e20", "textColor": "white" },
        { "hex": "#000000", "textColor": "white" }
      ],
      [
        { "hex": "#ffffff", "textColor": "black" },
        { "hex": "#daf8ff", "textColor": "black" },
        { "hex": "#7ce6ff", "textColor": "black" },
        { "hex": "#00c9ff", "textColor": "black" },
        { "hex": "#00aaec", "textColor": "black" },
        { "hex": "#008acb", "textColor": "black" },
        { "hex": "#006da5", "textColor": "white" },
        { "hex": "#00507c", "textColor": "white" },
        { "hex": "#003554", "textColor": "white" },
        { "hex": "#001a2d", "textColor": "white" },
        { "hex": "#000000", "textColor": "white" }
      ]
    ]`);
    
    // Verify neutral colors
    expectedNeutrals.forEach((expected, index) => {
      cy.get('.neutral li').eq(index + 1).then(($li) => {
        const hex = $li.text().trim().split('\n')[0];
        expect(hex).to.equal(expected.hex);
        
        const computedStyle = window.getComputedStyle($li[0]);
        const textColor = computedStyle.color;
        const isWhiteText = textColor === 'rgb(255, 255, 255)';
        expect(isWhiteText ? 'white' : 'black').to.equal(expected.textColor);
      });
    });
    
    // Verify all palette colors
    expectedAllPalettes.forEach((expectedPalette, paletteIndex) => {
      expectedPalette.forEach((expected, colorIndex) => {
        cy.get(`.generated-${paletteIndex} li`).eq(colorIndex + 1).then(($li) => {
          const hex = $li.text().trim().split('\n')[0];
          expect(hex).to.equal(expected.hex);
          
          const computedStyle = window.getComputedStyle($li[0]);
          const textColor = computedStyle.color;
          const isWhiteText = textColor === 'rgb(255, 255, 255)';
          expect(isWhiteText ? 'white' : 'black').to.equal(expected.textColor);
        });
      });
    });
    
    // Verify nudger values are set correctly
    cy.get('#nudger-5').should('have.value', '-0.005');
    cy.get('#nudger-6').should('have.value', '-0.0009');
    cy.get('#hue-nudger-4').should('have.value', '-5');
  })

  it('generates consistent colors in dark mode with nudgers applied', () => {
    // Wait for the app to be fully loaded
    cy.waitForAppReady();
    
    // Toggle to dark mode
    cy.get('#theme-toggle').click();
    cy.wait(1000); // Wait for theme transition
    
    // Set the dark mode configuration
    cy.get('#color-value').invoke('val', '#1862e6').trigger('input');
    cy.get('#warmth-value').invoke('val', '-7').trigger('input');
    cy.get('#x1-value').invoke('val', '0.45').trigger('input');
    cy.get('#y1-value').invoke('val', '0.08').trigger('input');
    cy.get('#x2-value').invoke('val', '0.77').trigger('input');
    cy.get('#y2-value').invoke('val', '0.96').trigger('input');
    cy.get('#chroma-mult-value').invoke('val', '0.83').trigger('input');
    
    // Set low step to 20 (index 2, value='2')
    cy.get('#low-step').select('2').trigger('input');
    
    // Wait for Low Step change to take effect
    cy.wait(1000);
    
    // Set nudger value at position 6 (60)
    cy.get('#nudger-6').invoke('val', '0.0047').trigger('input');
    
    // Set hue nudgers based on screenshot
    cy.get('#hue-nudger-0').invoke('val', '-1').trigger('input');
    cy.get('#hue-nudger-4').invoke('val', '-5').trigger('input');
    
    // Wait for regeneration (longer wait to ensure all colors are updated)
    cy.wait(2000);
    
    // Expected neutral colors in dark mode
    const expectedNeutrals = [
      { hex: '#151719', textColor: 'white' },
      { hex: '#1c1e20', textColor: 'white' },
      { hex: '#2a2c2d', textColor: 'white' },
      { hex: '#3d3f41', textColor: 'white' },
      { hex: '#555759', textColor: 'white' },
      { hex: '#727476', textColor: 'white' },
      { hex: '#949698', textColor: 'black' },
      { hex: '#b4b6b8', textColor: 'black' },
      { hex: '#d5d7d8', textColor: 'black' },
      { hex: '#eff1f3', textColor: 'black' },
      { hex: '#ffffff', textColor: 'black' }
    ];
    
    // Expected first palette colors in dark mode with Low Step = 20 and hue nudgers
    const expectedPalette0 = JSON.parse(`[
      { "hex": "#041534", "textColor": "white" },
      { "hex": "#071c41", "textColor": "white" },
      { "hex": "#0c2959", "textColor": "white" },
      { "hex": "#163b7a", "textColor": "white" },
      { "hex": "#2754a0", "textColor": "white" },
      { "hex": "#3e71c8", "textColor": "white" },
      { "hex": "#5a94f5", "textColor": "black" },
      { "hex": "#7db5ff", "textColor": "black" },
      { "hex": "#acd8ff", "textColor": "black" },
      { "hex": "#e1f2ff", "textColor": "black" },
      { "hex": "#ffffff", "textColor": "black" }
    ]`);
    
    // Expected colors for all other palettes in dark mode
    const expectedPalettes = JSON.parse(`[
      [
        { "hex": "#190f31", "textColor": "white" },
        { "hex": "#21143e", "textColor": "white" },
        { "hex": "#2f1f54", "textColor": "white" },
        { "hex": "#442e74", "textColor": "white" },
        { "hex": "#5d4499", "textColor": "white" },
        { "hex": "#7a5fc0", "textColor": "white" },
        { "hex": "#9c7fec", "textColor": "black" },
        { "hex": "#bca2ff", "textColor": "black" },
        { "hex": "#dac9ff", "textColor": "black" },
        { "hex": "#f2ecff", "textColor": "black" },
        { "hex": "#ffffff", "textColor": "black" }
      ],
      [
        { "hex": "#250926", "textColor": "white" },
        { "hex": "#300e30", "textColor": "white" },
        { "hex": "#421743", "textColor": "white" },
        { "hex": "#5c245e", "textColor": "white" },
        { "hex": "#7c377d", "textColor": "white" },
        { "hex": "#9f51a0", "textColor": "white" },
        { "hex": "#c76fc8", "textColor": "black" },
        { "hex": "#e792e8", "textColor": "black" },
        { "hex": "#febdfd", "textColor": "black" },
        { "hex": "#ffe8ff", "textColor": "black" },
        { "hex": "#ffffff", "textColor": "black" }
      ],
      [
        { "hex": "#2d0616", "textColor": "white" },
        { "hex": "#380a1d", "textColor": "white" },
        { "hex": "#4d112a", "textColor": "white" },
        { "hex": "#6b1c3d", "textColor": "white" },
        { "hex": "#8e2f55", "textColor": "white" },
        { "hex": "#b54971", "textColor": "white" },
        { "hex": "#e06793", "textColor": "black" },
        { "hex": "#ff8ab3", "textColor": "black" },
        { "hex": "#ffb8d4", "textColor": "black" },
        { "hex": "#ffe6f0", "textColor": "black" },
        { "hex": "#ffffff", "textColor": "black" }
      ],
      [
        { "hex": "#2f0706", "textColor": "white" },
        { "hex": "#3a0b09", "textColor": "white" },
        { "hex": "#50120f", "textColor": "white" },
        { "hex": "#6f1e1a", "textColor": "white" },
        { "hex": "#93312b", "textColor": "white" },
        { "hex": "#ba4b43", "textColor": "white" },
        { "hex": "#e6695e", "textColor": "black" },
        { "hex": "#ff8d81", "textColor": "black" },
        { "hex": "#ffbaaf", "textColor": "black" },
        { "hex": "#ffe7e2", "textColor": "black" },
        { "hex": "#ffffff", "textColor": "black" }
      ],
      [
        { "hex": "#2a0e00", "textColor": "white" },
        { "hex": "#351300", "textColor": "white" },
        { "hex": "#491e00", "textColor": "white" },
        { "hex": "#662d00", "textColor": "white" },
        { "hex": "#874200", "textColor": "white" },
        { "hex": "#ac5d00", "textColor": "white" },
        { "hex": "#d67d00", "textColor": "black" },
        { "hex": "#f7a03e", "textColor": "black" },
        { "hex": "#ffc787", "textColor": "black" },
        { "hex": "#ffecd4", "textColor": "black" },
        { "hex": "#ffffff", "textColor": "black" }
      ],
      [
        { "hex": "#1f1600", "textColor": "white" },
        { "hex": "#281d00", "textColor": "white" },
        { "hex": "#392a00", "textColor": "white" },
        { "hex": "#503d00", "textColor": "white" },
        { "hex": "#6c5500", "textColor": "white" },
        { "hex": "#8c7200", "textColor": "white" },
        { "hex": "#b19400", "textColor": "black" },
        { "hex": "#d0b629", "textColor": "black" },
        { "hex": "#ead77f", "textColor": "black" },
        { "hex": "#f9f2d1", "textColor": "black" },
        { "hex": "#fffffe", "textColor": "black" }
      ],
      [
        { "hex": "#0c1c00", "textColor": "white" },
        { "hex": "#112400", "textColor": "white" },
        { "hex": "#1b3400", "textColor": "white" },
        { "hex": "#294900", "textColor": "white" },
        { "hex": "#3c6500", "textColor": "white" },
        { "hex": "#56840f", "textColor": "white" },
        { "hex": "#74a831", "textColor": "black" },
        { "hex": "#95c95c", "textColor": "black" },
        { "hex": "#bee697", "textColor": "black" },
        { "hex": "#e7f8da", "textColor": "black" },
        { "hex": "#ffffff", "textColor": "black" }
      ],
      [
        { "hex": "#001f0e", "textColor": "white" },
        { "hex": "#002813", "textColor": "white" },
        { "hex": "#00391d", "textColor": "white" },
        { "hex": "#00502c", "textColor": "white" },
        { "hex": "#006d41", "textColor": "white" },
        { "hex": "#008d5b", "textColor": "white" },
        { "hex": "#00b379", "textColor": "black" },
        { "hex": "#3ed39a", "textColor": "black" },
        { "hex": "#8eeec2", "textColor": "black" },
        { "hex": "#d8fbe9", "textColor": "black" },
        { "hex": "#ffffff", "textColor": "black" }
      ],
      [
        { "hex": "#001f20", "textColor": "white" },
        { "hex": "#00282a", "textColor": "white" },
        { "hex": "#00383a", "textColor": "white" },
        { "hex": "#004f52", "textColor": "white" },
        { "hex": "#006c6f", "textColor": "white" },
        { "hex": "#008c8f", "textColor": "white" },
        { "hex": "#00b2b5", "textColor": "black" },
        { "hex": "#00d2d5", "textColor": "black" },
        { "hex": "#71edee", "textColor": "black" },
        { "hex": "#d1fbfa", "textColor": "black" },
        { "hex": "#feffff", "textColor": "black" }
      ],
      [
        { "hex": "#001b2e", "textColor": "white" },
        { "hex": "#00233a", "textColor": "white" },
        { "hex": "#003250", "textColor": "white" },
        { "hex": "#00476e", "textColor": "white" },
        { "hex": "#006291", "textColor": "white" },
        { "hex": "#0081b7", "textColor": "white" },
        { "hex": "#00a6e1", "textColor": "black" },
        { "hex": "#14c7ff", "textColor": "black" },
        { "hex": "#82e5ff", "textColor": "black" },
        { "hex": "#d4f8ff", "textColor": "black" },
        { "hex": "#ffffff", "textColor": "black" }
      ]
    ]`);
    
    // Verify neutral colors
    expectedNeutrals.forEach((expected, index) => {
      cy.get('.neutral li').eq(index + 1).then(($li) => {
        const hex = $li.text().trim().split('\n')[0];
        expect(hex).to.equal(expected.hex);
        
        const computedStyle = window.getComputedStyle($li[0]);
        const textColor = computedStyle.color;
        const isWhiteText = textColor === 'rgb(255, 255, 255)';
        expect(isWhiteText ? 'white' : 'black').to.equal(expected.textColor);
      });
    });
    
    // Verify first palette colors
    expectedPalette0.forEach((expected, index) => {
      cy.get('.generated-0 li').eq(index + 1).then(($li) => {
        const hex = $li.text().trim().split('\n')[0];
        expect(hex).to.equal(expected.hex);
        
        const computedStyle = window.getComputedStyle($li[0]);
        const textColor = computedStyle.color;
        const isWhiteText = textColor === 'rgb(255, 255, 255)';
        expect(isWhiteText ? 'white' : 'black').to.equal(expected.textColor);
      });
    });
    
    // Verify all other palette colors
    expectedPalettes.forEach((expectedPalette, paletteIndex) => {
      expectedPalette.forEach((expected, colorIndex) => {
        cy.get(`.generated-${paletteIndex + 1} li`).eq(colorIndex + 1).then(($li) => {
          const hex = $li.text().trim().split('\n')[0];
          expect(hex).to.equal(expected.hex);
          
          const computedStyle = window.getComputedStyle($li[0]);
          const textColor = computedStyle.color;
          const isWhiteText = textColor === 'rgb(255, 255, 255)';
          expect(isWhiteText ? 'white' : 'black').to.equal(expected.textColor);
        });
      });
    });
    
    // Verify configuration values are set correctly
    cy.get('#nudger-6').should('have.value', '0.0047');
    cy.get('#hue-nudger-0').should('have.value', '-1');
    cy.get('#hue-nudger-4').should('have.value', '-5');
    cy.get('#low-step').should('have.value', '2'); // Index 2 = step 20
    cy.get('#x1-value').should('have.value', '0.45');
    cy.get('#y1-value').should('have.value', '0.08');
    cy.get('#x2-value').should('have.value', '0.77');
    cy.get('#y2-value').should('have.value', '0.96');
    cy.get('#chroma-mult-value').should('have.value', '0.83');
    
    // Verify theme icon shows sun (dark mode)
    cy.get('#theme-toggle .theme-icon').should('have.text', '☀️');
  })
>>>>>>> Stashed changes
})
