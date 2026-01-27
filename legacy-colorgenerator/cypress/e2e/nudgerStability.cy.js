describe('Nudger Stability and Runaway Prevention', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3001');
    cy.wait(500); // Wait for initial render
  });

  describe('Lightness Nudger Stability', () => {
    it('should not cause runaway when changing lightness nudger value', () => {
      // Change nudger value
      cy.get('#nudger-4').clear().type('0.1');
      cy.wait(500); // Wait for debounce
      
      // Get color after change
      cy.get('.neutral li:nth-child(5)').invoke('text').then((afterChange) => {
        const firstChangeHex = afterChange.split('\n')[0];
        
        // Wait and check that color doesn't keep changing
        cy.wait(1000);
        cy.get('.neutral li:nth-child(5)').invoke('text').then((afterWait) => {
          const afterWaitHex = afterWait.split('\n')[0];
          
          // Color should be stable (same as after first change)
          expect(afterWaitHex).to.equal(firstChangeHex);
        });
      });
    });

    it('should not cause runaway with multiple sequential nudger changes', () => {
      // Apply final change
      cy.get('#nudger-4').clear().type('0.05');
      cy.wait(200);
      cy.get('#nudger-4').clear().type('0.1');
      cy.wait(200);
      cy.get('#nudger-4').clear().type('0.15');
      cy.wait(200);
      cy.get('#nudger-4').clear().type('0.2');
      cy.wait(500); // Wait for final debounce
      
      // Record final state
      cy.get('.neutral li:nth-child(5)').invoke('text').then((text) => {
        const finalColor = text.split('\n')[0];
        
        // Wait to ensure no runaway
        cy.wait(1500);
        
        // Check color is still stable
        cy.get('.neutral li:nth-child(5)').invoke('text').then((afterWait) => {
          expect(afterWait.split('\n')[0]).to.equal(finalColor);
        });
      });
    });

    it('should maintain stable nudger input value after change', () => {
      // Set nudger value
      cy.get('#nudger-4').clear().type('0.15');
      cy.wait(500);
      
      // Check value is set correctly
      cy.get('#nudger-4').should('have.value', '0.15');
      
      // Wait and verify value doesn't change on its own
      cy.wait(1000);
      cy.get('#nudger-4').should('have.value', '0.15');
      
      // Wait more to be absolutely sure
      cy.wait(1000);
      cy.get('#nudger-4').should('have.value', '0.15');
    });
  });

  describe('Lightness Nudger + Low Step Interaction', () => {
    it('should not cause runaway when changing nudger, then low step, then nudger again', () => {
      // Step 1: Change lightness nudger
      cy.get('#nudger-4').clear().type('0.1');
      cy.wait(500);
      
      // Step 2: Change low step
      cy.get('#low-step').select('3');
      cy.wait(500);
      
      // Step 3: Change lightness nudger again
      cy.get('#nudger-4').clear().type('0.15');
      cy.wait(500);
      
      // Record final state
      cy.get('.neutral li:nth-child(5)').invoke('text').then((finalText) => {
        const finalColor = finalText.split('\n')[0];
        
        // Wait to ensure stability
        cy.wait(1500);
        
        // Check nudger value is stable
        cy.get('#nudger-4').should('have.value', '0.15');
        
        // Check color is stable
        cy.get('.neutral li:nth-child(5)').invoke('text').then((afterWait) => {
          expect(afterWait.split('\n')[0]).to.equal(finalColor);
        });
      });
    });

    it('should not cause runaway with multiple nudger and low step changes', () => {
      // Complex sequence that previously caused runaway
      cy.get('#nudger-4').clear().type('0.1');
      cy.wait(500);
      
      cy.get('#nudger-4').clear().type('0.2');
      cy.wait(500);
      
      cy.get('#low-step').select('3');
      cy.wait(500);
      
      cy.get('#nudger-4').clear().type('0.15');
      cy.wait(500);
      
      // Record final state
      cy.get('#nudger-4').invoke('val').then((finalNudgerValue) => {
        cy.get('.neutral li:nth-child(5)').invoke('text').then((text) => {
          const finalColor = text.split('\n')[0];
          
          // Wait to ensure no runaway
          cy.wait(2000);
          
          // Verify stability
          cy.get('#nudger-4').should('have.value', finalNudgerValue);
          cy.get('.neutral li:nth-child(5)').invoke('text').then((afterWait) => {
            expect(afterWait.split('\n')[0]).to.equal(finalColor);
          });
        });
      });
    });
  });

  describe('Hue Nudger Stability', () => {
    it('should not cause runaway when changing hue nudger value', () => {
      // Change hue nudger value
      cy.get('#hue-nudger-0').clear().type('-2');
      cy.wait(500);
      
      // Get color after change - use correct selector for palette list items
      cy.get('#palettes ul:first-child li:nth-child(5)').invoke('text').then((afterChange) => {
        const changedHex = afterChange.split('\n')[0];
        
        // Wait and verify stability
        cy.wait(1000);
        cy.get('#palettes ul:first-child li:nth-child(5)').invoke('text').then((afterWait) => {
          const afterWaitHex = afterWait.split('\n')[0];
          expect(afterWaitHex).to.equal(changedHex);
        });
      });
    });

    it('should maintain stable hue nudger input value after change', () => {
      cy.get('#hue-nudger-0').clear().type('-3');
      cy.wait(500);
      
      cy.get('#hue-nudger-0').should('have.value', '-3');
      
      cy.wait(1500);
      cy.get('#hue-nudger-0').should('have.value', '-3');
    });

    it('should not affect neutrals when hue nudger changes in light mode', () => {
      cy.wait(1000);
      cy.get('.neutral li[data-test-step="5"]').should('contain.text', '#');
      
      // Capture neutral colors before hue nudger change
      cy.get('.neutral li[data-test-step="3"]').invoke('text').then((step3Before) => {
        cy.get('.neutral li[data-test-step="5"]').invoke('text').then((step5Before) => {
          cy.get('.neutral li[data-test-step="7"]').invoke('text').then((step7Before) => {
            const beforeStep3 = step3Before.trim().split('\n')[0];
            const beforeStep5 = step5Before.trim().split('\n')[0];
            const beforeStep7 = step7Before.trim().split('\n')[0];
            
            // Change hue nudger
            cy.get('#hue-nudger-0').clear().type('15');
            cy.wait(500);
            
            // Verify neutrals unchanged
            cy.get('.neutral li[data-test-step="3"]').invoke('text').then((text) => {
              expect(text.trim().split('\n')[0]).to.equal(beforeStep3);
            });
            cy.get('.neutral li[data-test-step="5"]').invoke('text').then((text) => {
              expect(text.trim().split('\n')[0]).to.equal(beforeStep5);
            });
            cy.get('.neutral li[data-test-step="7"]').invoke('text').then((text) => {
              expect(text.trim().split('\n')[0]).to.equal(beforeStep7);
            });
          });
        });
      });
    });
  });

  describe('Bezier Curve Stability', () => {
    it('should not cause runaway when changing bezier curve in light mode', () => {
      // Change x1 bezier value
      cy.get('#x1-value').clear().type('0.2');
      cy.wait(500);
      
      // Get color after change
      cy.get('.neutral li[data-test-step="5"]').invoke('text').then((afterChange) => {
        const changedHex = afterChange.trim().split('\n')[0];
        
        // Wait and verify stability
        cy.wait(1000);
        cy.get('.neutral li[data-test-step="5"]').invoke('text').then((afterWait) => {
          const afterWaitHex = afterWait.trim().split('\n')[0];
          expect(afterWaitHex).to.equal(changedHex);
        });
      });
    });

    it('should not cause runaway when changing bezier curve in dark mode', () => {
      // Toggle to dark mode
      cy.get('button').contains('Toggle Theme').click();
      cy.wait(500);
      
      // Change x1 bezier value
      cy.get('#x1-value').clear().type('0.5');
      cy.wait(500);
      
      // Get color after change
      cy.get('.neutral li[data-test-step="5"]').invoke('text').then((afterChange) => {
        const changedHex = afterChange.trim().split('\n')[0];
        
        // Wait and verify stability
        cy.wait(1000);
        cy.get('.neutral li[data-test-step="5"]').invoke('text').then((afterWait) => {
          const afterWaitHex = afterWait.trim().split('\n')[0];
          expect(afterWaitHex).to.equal(changedHex);
        });
      });
    });

    it('should not cause incremental brightness changes with repeated bezier adjustments in dark mode', () => {
      // Toggle to dark mode
      cy.get('button').contains('Toggle Theme').click();
      cy.wait(500);
      
      // Capture initial color
      cy.get('.neutral li[data-test-step="5"]').invoke('text').then((initialText) => {
        const initialHex = initialText.trim().split('\n')[0];
        
        // Make multiple small changes to x1
        cy.get('#x1-value').clear().type('0.46');
        cy.wait(200);
        cy.get('#x1-value').clear().type('0.47');
        cy.wait(200);
        cy.get('#x1-value').clear().type('0.48');
        cy.wait(200);
        
        // Check final color - it should be different from initial (expected)
        cy.get('.neutral li[data-test-step="5"]').invoke('text').then((finalText) => {
          const finalHex = finalText.trim().split('\n')[0];
          
          // The color should have changed (bezier curve affects interpolation)
          expect(finalHex).to.not.equal(initialHex);
          
          // Now reset to original value and check if it returns to original
          cy.get('#x1-value').clear().type('0.45'); // Original dark mode value
          cy.wait(500);
          
          cy.get('.neutral li[data-test-step="5"]').invoke('text').then((resetText) => {
            const resetHex = resetText.trim().split('\n')[0];
            
            // Should return to original color (no accumulation)
            expect(resetHex).to.equal(initialHex);
          });
        });
      });
    });

    it('should not cause incremental brightness changes with repeated bezier adjustments in light mode', () => {
      // Ensure we're in light mode
      cy.get('body').should('have.css', 'background-color', 'rgb(255, 255, 255)');
      
      // Capture initial color
      cy.get('.neutral li[data-test-step="5"]').invoke('text').then((initialText) => {
        const initialHex = initialText.trim().split('\n')[0];
        
        // Make multiple small changes to x1
        cy.get('#x1-value').clear().type('0.18');
        cy.wait(200);
        cy.get('#x1-value').clear().type('0.19');
        cy.wait(200);
        cy.get('#x1-value').clear().type('0.20');
        cy.wait(200);
        
        // Check final color - it should be different from initial (expected)
        cy.get('.neutral li[data-test-step="5"]').invoke('text').then((finalText) => {
          const finalHex = finalText.trim().split('\n')[0];
          
          // The color should have changed (bezier curve affects interpolation)
          expect(finalHex).to.not.equal(initialHex);
          
          // Now reset to original value and check if it returns to original
          cy.get('#x1-value').clear().type('0.16'); // Original light mode value
          cy.wait(500);
          
          cy.get('.neutral li[data-test-step="5"]').invoke('text').then((resetText) => {
            const resetHex = resetText.trim().split('\n')[0];
            
            // Should return to original color (no accumulation)
            expect(resetHex).to.equal(initialHex);
          });
        });
      });
    });
  });

  describe('Light Mode Cross-Column Prevention', () => {
    it('should only affect the nudged step, not other steps in light mode', () => {
      // Wait for colors to be fully rendered
      cy.wait(1000);
      cy.get('.neutral li[data-test-step="5"]').should('contain.text', '#');
      
      // Capture step 5 before change, then modify and verify
      cy.get('.neutral li[data-test-step="5"]').invoke('text').then((beforeText) => {
        const beforeStep5 = beforeText.trim().split('\n')[0];
        
        // Change nudger 5
        cy.get('#nudger-5').clear().type('0.02');
        cy.wait(500);
        
        // Verify step 5 changed
        cy.get('.neutral li[data-test-step="5"]').invoke('text').then((afterText) => {
          expect(afterText.trim().split('\n')[0]).to.not.equal(beforeStep5);
        });
      });
    });
    
    it('should not affect other steps when nudger changes in light mode', () => {
      // Capture multiple steps before change
      cy.get('.neutral li[data-test-step="2"]').invoke('text').then((step2Before) => {
        cy.get('.neutral li[data-test-step="3"]').invoke('text').then((step3Before) => {
          cy.get('.neutral li[data-test-step="6"]').invoke('text').then((step6Before) => {
            const beforeStep2 = step2Before.trim().split('\n')[0];
            const beforeStep3 = step3Before.trim().split('\n')[0];
            const beforeStep6 = step6Before.trim().split('\n')[0];
            
            // Change nudger 5
            cy.get('#nudger-5').clear().type('0.02');
            cy.wait(500);
            
            // Verify other steps unchanged
            cy.get('.neutral li[data-test-step="2"]').invoke('text').then((text) => {
              expect(text.trim().split('\n')[0]).to.equal(beforeStep2);
            });
            cy.get('.neutral li[data-test-step="3"]').invoke('text').then((text) => {
              expect(text.trim().split('\n')[0]).to.equal(beforeStep3);
            });
            cy.get('.neutral li[data-test-step="6"]').invoke('text').then((text) => {
              expect(text.trim().split('\n')[0]).to.equal(beforeStep6);
            });
          });
        });
      });
    });
  });

  describe('Dark Mode Nudger Stability', () => {
    beforeEach(() => {
      // Toggle to dark mode
      cy.get('button').contains('Toggle Theme').click();
      cy.wait(500);
    });

    it('should not cause runaway in dark mode when changing lightness nudger', () => {
      cy.get('#nudger-4').clear().type('0.1');
      cy.wait(500);
      
      cy.get('.neutral li:nth-child(5)').invoke('text').then((afterChange) => {
        const changedHex = afterChange.split('\n')[0];
        
        // Wait to ensure stability
        cy.wait(1500);
        
        cy.get('#nudger-4').should('have.value', '0.1');
        cy.get('.neutral li:nth-child(5)').invoke('text').then((afterWait) => {
          expect(afterWait.split('\n')[0]).to.equal(changedHex);
        });
      });
    });

    it('should not cause runaway in dark mode with nudger + low step sequence', () => {
      cy.get('#nudger-4').clear().type('0.15');
      cy.wait(500);
      
      cy.get('#low-step').select('4');
      cy.wait(500);
      
      cy.get('#nudger-4').clear().type('0.2');
      cy.wait(500);
      
      cy.get('#nudger-4').invoke('val').then((finalNudgerValue) => {
        cy.get('.neutral li:nth-child(5)').invoke('text').then((text) => {
          const finalColor = text.split('\n')[0];
          
          // Wait to ensure no runaway
          cy.wait(2000);
          
          cy.get('#nudger-4').should('have.value', finalNudgerValue);
          cy.get('.neutral li:nth-child(5)').invoke('text').then((afterWait) => {
            expect(afterWait.split('\n')[0]).to.equal(finalColor);
          });
        });
      });
    });

    it('should only affect the nudged step in dark mode', () => {
      // Wait for colors to be fully rendered after theme toggle
      cy.wait(1000);
      cy.get('.neutral li[data-test-step="5"]').should('contain.text', '#');
      
      // Capture step 5 before change, then modify and verify
      cy.get('.neutral li[data-test-step="5"]').invoke('text').then((beforeText) => {
        const beforeStep5 = beforeText.trim().split('\n')[0];
        
        // Change nudger 5
        cy.get('#nudger-5').clear().type('0.02');
        cy.wait(500);
        
        // Verify step 5 changed
        cy.get('.neutral li[data-test-step="5"]').invoke('text').then((afterText) => {
          expect(afterText.trim().split('\n')[0]).to.not.equal(beforeStep5);
        });
      });
    });
    
    it('should not affect other steps when nudger changes in dark mode', () => {
      // Wait for colors to be fully rendered
      cy.wait(1000);
      
      // Capture multiple steps before change
      cy.get('.neutral li[data-test-step="2"]').invoke('text').then((step2Before) => {
        cy.get('.neutral li[data-test-step="3"]').invoke('text').then((step3Before) => {
          cy.get('.neutral li[data-test-step="6"]').invoke('text').then((step6Before) => {
            const beforeStep2 = step2Before.trim().split('\n')[0];
            const beforeStep3 = step3Before.trim().split('\n')[0];
            const beforeStep6 = step6Before.trim().split('\n')[0];
            
            // Change nudger 5
            cy.get('#nudger-5').clear().type('0.02');
            cy.wait(500);
            
            // Verify other steps unchanged
            cy.get('.neutral li[data-test-step="2"]').invoke('text').then((text) => {
              expect(text.trim().split('\n')[0]).to.equal(beforeStep2);
            });
            cy.get('.neutral li[data-test-step="3"]').invoke('text').then((text) => {
              expect(text.trim().split('\n')[0]).to.equal(beforeStep3);
            });
            cy.get('.neutral li[data-test-step="6"]').invoke('text').then((text) => {
              expect(text.trim().split('\n')[0]).to.equal(beforeStep6);
            });
          });
        });
      });
    });

    it('should only affect the nudged step across all palettes in dark mode', () => {
      // Wait for colors to be fully rendered after theme toggle
      cy.wait(1000);
      cy.get('#palettes li[data-test-palette="0"][data-test-step="5"]').should('contain.text', '#');
      
      // Capture palette step 5 before change, then modify and verify
      cy.get('#palettes li[data-test-palette="0"][data-test-step="5"]').invoke('text').then((beforeText) => {
        const beforePaletteStep5 = beforeText.trim().split('\n')[0];
        
        // Change nudger 5
        cy.get('#nudger-5').clear().type('0.02');
        cy.wait(500);
        
        // Verify palette step 5 changed
        cy.get('#palettes li[data-test-palette="0"][data-test-step="5"]').invoke('text').then((afterText) => {
          expect(afterText.trim().split('\n')[0]).to.not.equal(beforePaletteStep5);
        });
      });
    });
    
    it('should not affect other palette steps when nudger changes in dark mode', () => {
      // Wait for colors to be fully rendered
      cy.wait(1000);
      
      // Capture multiple palette steps before change
      cy.get('#palettes li[data-test-palette="0"][data-test-step="2"]').invoke('text').then((step2Before) => {
        cy.get('#palettes li[data-test-palette="0"][data-test-step="6"]').invoke('text').then((step6Before) => {
          const beforePaletteStep2 = step2Before.trim().split('\n')[0];
          const beforePaletteStep6 = step6Before.trim().split('\n')[0];
          
          // Change nudger 5
          cy.get('#nudger-5').clear().type('0.02');
          cy.wait(500);
          
          // Verify other palette steps unchanged
          cy.get('#palettes li[data-test-palette="0"][data-test-step="2"]').invoke('text').then((text) => {
            expect(text.trim().split('\n')[0]).to.equal(beforePaletteStep2);
          });
          cy.get('#palettes li[data-test-palette="0"][data-test-step="6"]').invoke('text').then((text) => {
            expect(text.trim().split('\n')[0]).to.equal(beforePaletteStep6);
          });
        });
      });
    });

    it('should not affect neutrals when hue nudger changes in dark mode', () => {
      cy.wait(1000);
      cy.get('.neutral li[data-test-step="5"]').should('contain.text', '#');
      
      // Capture neutral colors before hue nudger change
      cy.get('.neutral li[data-test-step="3"]').invoke('text').then((step3Before) => {
        cy.get('.neutral li[data-test-step="5"]').invoke('text').then((step5Before) => {
          cy.get('.neutral li[data-test-step="7"]').invoke('text').then((step7Before) => {
            const beforeStep3 = step3Before.trim().split('\n')[0];
            const beforeStep5 = step5Before.trim().split('\n')[0];
            const beforeStep7 = step7Before.trim().split('\n')[0];
            
            // Change hue nudger
            cy.get('#hue-nudger-0').clear().type('15');
            cy.wait(500);
            
            // Verify neutrals unchanged
            cy.get('.neutral li[data-test-step="3"]').invoke('text').then((text) => {
              expect(text.trim().split('\n')[0]).to.equal(beforeStep3);
            });
            cy.get('.neutral li[data-test-step="5"]').invoke('text').then((text) => {
              expect(text.trim().split('\n')[0]).to.equal(beforeStep5);
            });
            cy.get('.neutral li[data-test-step="7"]').invoke('text').then((text) => {
              expect(text.trim().split('\n')[0]).to.equal(beforeStep7);
            });
          });
        });
      });
    });
  });

  describe('Direct Stability Monitoring', () => {
    it('should maintain consistent state through repeated sampling', () => {
      // Make a change
      cy.get('#nudger-4').clear().type('0.1');
      cy.wait(500);
      
      // Sample the state multiple times to detect any runaway changes
      const samples = [];
      
      // Take 5 samples over 2 seconds
      for (let i = 0; i < 5; i++) {
        cy.wait(400);
        cy.get('#nudger-4').invoke('val').then((val) => {
          samples.push({ nudger: val, timestamp: Date.now() });
        });
        cy.get('.neutral li:nth-child(5)').invoke('text').then((text) => {
          samples[samples.length - 1].color = text.split('\n')[0];
        });
      }
      
      // Verify all samples are identical (no runaway)
      cy.then(() => {
        const firstSample = samples[0];
        const allSame = samples.every(sample => 
          sample.nudger === firstSample.nudger && 
          sample.color === firstSample.color
        );
        expect(allSame).to.be.true;
        
        // Also verify the final values are what we expect
        expect(firstSample.nudger).to.equal('0.1');
      });
    });
  });

  describe('Rapid Sequential Changes', () => {
    it('should handle rapid nudger changes without runaway', () => {
      // Simulate rapid user input
      cy.get('#nudger-4').clear().type('0.05');
      cy.wait(100);
      cy.get('#nudger-4').clear().type('0.1');
      cy.wait(100);
      cy.get('#nudger-4').clear().type('0.15');
      cy.wait(100);
      cy.get('#nudger-4').clear().type('0.2');
      
      // Wait for debounce to settle
      cy.wait(1000);
      
      // Check final value is stable
      cy.get('#nudger-4').should('have.value', '0.2');
      
      // Wait more to ensure no runaway
      cy.wait(1500);
      cy.get('#nudger-4').should('have.value', '0.2');
    });
  });
});
