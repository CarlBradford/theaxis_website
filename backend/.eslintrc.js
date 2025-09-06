module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:jest/recommended',
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  plugins: ['jest', 'node'],
  rules: {
    // Error handling
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'error',
    
    // Code quality
    'prefer-const': 'error',
    'no-var': 'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-undef': 'error',
    'no-redeclare': 'error',
    
    // Async/await
    'no-async-promise-executor': 'error',
    'no-await-in-loop': 'warn',
    
    // Security
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // Best practices
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
    'no-trailing-spaces': 'error',
    'eol-last': 'error',
    
    // Node.js specific
    'node/no-unsupported-features/es-syntax': 'off',
    'node/no-missing-import': 'off',
    'node/no-unpublished-import': 'off',
    'node/no-unpublished-require': 'off',
    
    // Jest specific
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error',
  },
  overrides: [
    {
      files: ['tests/**/*.js'],
      env: {
        jest: true,
      },
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['src/server.js'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/',
    '*.min.js',
    '*.bundle.js',
  ],
};
