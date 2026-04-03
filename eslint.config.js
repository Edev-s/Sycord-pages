export default [
  {
    ignores: [
      '.next',
      'node_modules',
      'dist',
      '.git',
      'out',
      'build',
      '**/*.tsx',
      '**/*.ts',
      'eslint.config.js'
    ]
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    rules: {
      // Add any rules as needed
    }
  }
];
