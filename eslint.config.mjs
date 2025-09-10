import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // Custom rule to prevent async client components
      "no-restricted-syntax": [
        "error",
        {
          "selector": "Program:has(Directive[value='use client']) ExportDefaultDeclaration[declaration.type='FunctionDeclaration'][declaration.async=true]",
          "message": "Async client components are not allowed. Use useEffect for data loading instead."
        },
        {
          "selector": "Program:has(Directive[value='use client']) JSXExpressionContainer[expression.type='CallExpression'][expression.callee.type='Identifier'][expression.callee.name=/^[A-Z]/]",
          "message": "Function calls in JSX are not allowed in client components. Use state and useEffect instead."
        },
        // {
        //   "selector": "Program:has(Directive[value='use client']) ImportDeclaration[source.value=/^@\\/lib\\//]",
        //   "message": "Direct imports from @/lib/ are not allowed in client components. Use API calls instead."
        // }
      ],
      // Additional rules for better code quality
      "no-promise-executor-return": "warn",
      "no-async-promise-executor": "error",
      "react/no-unstable-nested-components": "off",
      "@next/next/no-async-client-component": "error"
    }
  }
];

export default eslintConfig;
