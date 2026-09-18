module.exports = async () => {
    return {
        "testEnvironment": "jsdom",
        "moduleFileExtensions": ["ts", "tsx", "js", "jsx", "json", "node"],
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
