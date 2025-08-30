export default {
    testEnvironment: "node",
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                useESM: true,
                tsconfig: "tsconfig.json",
            },
        ],
    },
    extensionsToTreatAsEsm: [".ts"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    transformIgnorePatterns: ["/node_modules/(?!mongodb-memory-server)/"],
    testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
    setupFilesAfterEnv: ["<rootDir>/_tests/test_setup.ts"],
    testPathIgnorePatterns: ["/node_modules/", "/dist/"],
    // moduleDirectories: ["node_modules", "src", "src/docs", "_tests"],
};
