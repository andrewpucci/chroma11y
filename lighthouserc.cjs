module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run build && npm run preview -- --host --port 4173',
      startServerReadyPattern: '4173',
      url: ['http://localhost:4173/'],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop'
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }]
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: 'lighthouse-report'
    }
  }
};
