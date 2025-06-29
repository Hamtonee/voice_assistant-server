module.exports = {
  "extends": [
    "react-app",
    "react-app/jest"
  ],
  "rules": {
    // Disable unused vars warnings for specific patterns that are intentionally kept
    "no-unused-vars": [
      "warn", 
      { 
        "vars": "all",
        "args": "after-used",
        "ignoreRestSiblings": true,
        "varsIgnorePattern": "^_|^set[A-Z].*|^handle[A-Z].*|^is[A-Z].*|^fetch[A-Z].*|^render[A-Z].*|^get[A-Z].*|^load[A-Z].*|^save[A-Z].*|^reset[A-Z].*|^toggle[A-Z].*|^update[A-Z].*|^clear[A-Z].*|^mark[A-Z].*",
        "argsIgnorePattern": "^_|event|e|error|err"
      }
    ],
    
    // React Hooks dependency warnings - make them warnings instead of errors
    "react-hooks/exhaustive-deps": "warn",
    
    // Allow console statements in development
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    
    // Allow unused expressions (for debugging)
    "no-unused-expressions": ["warn", { 
      "allowShortCircuit": true, 
      "allowTernary": true,
      "allowTaggedTemplates": true
    }],
    
    // Relax some React-specific rules
    "react/prop-types": "off",
    "react/display-name": "off",
    "react/no-unescaped-entities": "warn",
    
    // Allow any type of quotes
    "quotes": "off",
    
    // Allow semicolons or not
    "semi": "off",
    
    // Allow trailing commas
    "comma-dangle": "off",
    
    // Allow both function declarations and expressions
    "func-style": "off",
    
    // Don't require default case in switch statements
    "default-case": "off",
    
    // Allow assignments in conditions
    "no-cond-assign": "warn",
    
    // Allow empty catch blocks
    "no-empty": ["warn", { "allowEmptyCatch": true }]
  },
  
  "env": {
    "browser": true,
    "es6": true,
    "node": true,
    "jest": true
  },
  
  "parserOptions": {
    "ecmaVersion": 2021,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}; 