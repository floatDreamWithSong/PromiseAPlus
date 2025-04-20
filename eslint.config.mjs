import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { 
    files: ["**/*.{js,mjs,cjs}"], 
    plugins: { js }, 
    extends: ["js/recommended"] ,
    rules: {
      "no-unused-vars": "off"
    }
  },
  { 
    files: ["**/*.js"], 
    languageOptions: { sourceType: "commonjs" } 
  },
  { 
    files: ["**/*.{js,mjs,cjs}"], 
    languageOptions: { globals: globals.browser } 
  },
  { 
    files: ["**/*.{js,mjs,cjs}"], // Specify the files this rule applies to

  }
]);