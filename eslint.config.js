"use strict";

const globals = require("globals");
const react = require("eslint-plugin-react");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  {
    ignores: [
      "node_modules/**",
      "client/node_modules/**",
      "client/build/**",
      "client/dist/**",
      "coverage/**",
      "docs/**",
    ],
  },
  {
    // Server, seed and tests: CommonJS on Node.
    files: [
      "src/**/*.js",
      "tests/**/*.js",
      "prisma/**/*.js",
      "server.js",
      "eslint.config.js",
      "prisma.config.js",
    ],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "commonjs",
      globals: { ...globals.node },
    },
    rules: {
      "no-console": "warn",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "smart"],
      "no-debugger": "error",
      "no-implicit-coercion": "warn",
    },
  },
  {
    // The seed script is a CLI: printing what it wrote is the point.
    files: ["prisma/seed.js"],
    rules: { "no-console": "off" },
  },
  {
    // React client: ES modules in the browser.
    files: ["client/src/**/*.{js,jsx}", "client/vite.config.js"],
    plugins: { react },
    settings: { react: { version: "detect" } },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.vitest },
    },
    rules: {
      // Without these, every component referenced only inside JSX reads as unused.
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
      "react/jsx-key": "error",
      "react/no-danger": "error",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "smart"],
      "no-debugger": "error",
      "no-alert": "error",
      "no-console": "warn",
    },
  },
];
