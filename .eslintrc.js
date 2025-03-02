module.exports = {
  extends: [
    // Keep your existing extends
    // e.g. "next/core-web-vitals"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
  },
  plugins: ["@typescript-eslint"],
  rules: {
    // Disable noisy TypeScript ESLint rules
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-return": "off",
    "@typescript-eslint/no-unsafe-argument": "off",
    "@typescript-eslint/no-redundant-type-constituents": "off",
    
    // Make implicit any parameters a warning instead of error
    "@typescript-eslint/no-explicit-any": "warn",
    
    // Keep useful rules enabled
    "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    "no-unused-vars": "off", // TypeScript handles this better
    "@typescript-eslint/no-unused-vars": "warn",
    
    // Add more rules you want to keep
  },
  // Avoid linting in node_modules and .next
  ignorePatterns: ["node_modules/", ".next/", "*.config.js"]
}; 