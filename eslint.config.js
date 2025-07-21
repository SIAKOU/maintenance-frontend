import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // Désactive l'obligation d'importer React avec JSX (React 17+)
      "react/react-in-jsx-scope": "off",

      // Désactive les prop-types car tu utilises TypeScript
      "react/prop-types": "off",

      // Réduit la sévérité des any
      "@typescript-eslint/no-explicit-any": "warn",

      // Autorise les textes non échappés
      "react/no-unescaped-entities": "off",

      // Pour react-refresh
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
