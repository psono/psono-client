module.exports = async () => {
    return {
        "testEnvironment": "jsdom",
        "moduleFileExtensions": ["ts", "tsx", "js", "jsx", "json", "node"],
        "moduleNameMapper": {
            // Jest 27 does not resolve these packages' conditional exports.
            "^@tiptap/pm/(.*)$": "<rootDir>/node_modules/@tiptap/pm/dist/$1/index.cjs",
            "^@tiptap/core/jsx-runtime$": "<rootDir>/node_modules/@tiptap/core/dist/jsx-runtime/jsx-runtime.cjs"
        },
        "transform": {
            "^.+\\.[jt]sx?$": "babel-jest"
        },
        "setupFilesAfterEnv": [
            "<rootDir>/src/setupTests.js"
        ],
        "globals": {
            "TARGET": "webclient"
        },
    };
};
