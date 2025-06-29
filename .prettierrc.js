module.exports = {
  // Basic formatting
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  
  // React/JSX specific
  jsxSingleQuote: true,
  jsxBracketSameLine: false,
  
  // Misc
  endOfLine: 'lf',
  arrowParens: 'avoid',
  bracketSpacing: true,
  insertPragma: false,
  requirePragma: false,
  proseWrap: 'preserve',
  
  // File-specific overrides
  overrides: [
    {
      files: '*.json',
      options: {
        singleQuote: false,
      },
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
        printWidth: 80,
      },
    },
    {
      files: ['*.js', '*.jsx'],
      options: {
        parser: 'babel',
      },
    },
  ],
}; 