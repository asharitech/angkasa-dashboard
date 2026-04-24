import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Unused variables — error, allow _-prefixed intentional ignores
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          vars: "all",
          args: "after-used",
          ignoreRestSiblings: true,
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // No `any` — keeps the type safety work we just did meaningful
      "@typescript-eslint/no-explicit-any": "error",

      // Enforce `import type` for type-only imports — keeps bundles clean
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],

      // No leftover console.log in app code — use proper error handling
      "no-console": ["warn", { allow: ["error", "warn"] }],

      // Prefer const over let when variable is never reassigned
      "prefer-const": "error",
    },
  },
  // Scripts are CLI tools — console output is intentional
  {
    files: ["scripts/**"],
    rules: { "no-console": "off" },
  },
]);

export default eslintConfig;
