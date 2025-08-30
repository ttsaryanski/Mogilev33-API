import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import eslintPluginPrettier from "eslint-plugin-prettier";
import tseslint from "typescript-eslint";

export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        ignores: ["dist/**/*", "node_modules/**/*", "src/types/**/*"],
    },
    {
        files: ["**/*.js", "**/*.ts"],
        plugins: {
            prettier: eslintPluginPrettier,
        },
        rules: {
            "prettier/prettier": ["error"],
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    vars: "all",
                    args: "after-used",
                    ignoreRestSiblings: false,
                    varsIgnorePattern: "^_",
                    argsIgnorePattern: "^_",
                },
            ],
            "no-console": "off",
            eqeqeq: ["error", "always"],
            semi: ["error", "always"],
            "@typescript-eslint/no-explicit-any": "error",
        },
    },
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: "module",
            globals: {
                console: "readonly",
                process: "readonly",
                require: "readonly",
                module: "readonly",
            },
        },
    },
    // {
    //     files: ["**/*.test.ts"],
    //     rules: {
    //         "@typescript-eslint/no-explicit-any": "off",
    //     },
    // },
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: "./tsconfig.json",
                sourceType: "module",
                ecmaVersion: 2021,
            },
            globals: {
                process: "readonly",
                __dirname: "readonly",
                module: "readonly",
                require: "readonly",
                describe: "readonly",
                test: "readonly",
                expect: "readonly",
                jest: "readonly",
                beforeEach: "readonly",
                afterEach: "readonly",
                beforeAll: "readonly",
                afterAll: "readonly",
                it: "readonly",
                global: "readonly",
                console: "readonly",
                Buffer: "readonly",
            },
        },
    },

    prettier,
];
