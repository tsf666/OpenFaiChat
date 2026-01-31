import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import css from "@eslint/css";
import { defineConfig } from "eslint/config";
import astroPlugin from 'eslint-plugin-astro';
import astroParser from 'astro-eslint-parser';

export default [

  {
    
    ignores: [
      "**/node_modules/**",
      "dist/**",
      "public/**",
      ".astro/**",
      ".vercel/**",
      ".netlify/**",
      "src/**/*.css",
      "src/**/*.md",
      "src/layouts/Layout.astro", 
      "**/*.d.ts"
    ]
  },
  

  ...defineConfig([
  
    {
     
      linterOptions: {
        reportUnusedDisableDirectives: "off"
      },
   
    },

    { 
     
      files: ["src/**/*.{js,mjs,ts,mts,tsx}"], 
      languageOptions: { 
        globals: { ...globals.browser, ...globals.node },
        ecmaVersion: "latest"
      } 
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,

  
    {
      
      files: ["src/pages/**/*.astro", "src/components/**/*.astro"], 
      
      plugins: { astro: astroPlugin },
      languageOptions: {
        parser: astroParser,
        parserOptions: { parser: tseslint.parser, extraFileExtensions: [".astro"] },
      },
      rules: {
        ...astroPlugin.configs.recommended.rules,
        
        "no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
        
        "astro/no-unused-define-vars-in-style": "warn"
      },
    },
    
    {
      rules: {
        "no-console": ["error", { allow: ["warn", "error"] }],
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-expressions": "off",
        "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
      
        "eslint-comments/no-unused-disable": "off"
      }
    },
    
  

    
    { files: ["**/*.json"], plugins: { json }, language: "json/json", extends: ["json/recommended"] },
   
  ])
];