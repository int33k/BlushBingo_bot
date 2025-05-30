const js = require('@eslint/js');

module.exports = [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'src/**/*.ts', '**/*.ts'],
  },
  // JavaScript files
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        // Jest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-unused-vars': 'warn',
      'no-undef': 'error',
    },
  },
  // TypeScript files - minimal rules to avoid parsing errors
  {
    files: ['**/*.ts'],
    rules: {
      // Disable rules that cause parsing errors with TypeScript
      'no-undef': 'off', // TypeScript handles this
      'no-unused-vars': 'off', // TypeScript handles this
    },
  },
];
