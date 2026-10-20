// @ts-check
import base from "./base.mjs";

export default [
  ...base,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // Nest relies on parameter decorators without using the param body directly
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      // Nest's DI needs real (value) imports for constructor parameter types so
      // emitDecoratorMetadata can produce a runtime reference — `import type`
      // erases the class and breaks dependency resolution at boot.
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },
];
