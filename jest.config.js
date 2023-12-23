module.exports = async () => {
    return {
        "testEnvironment": "jsdom",
        "setupFilesAfterEnv": [
            "<rootDir>/src/setupTests.js"
        ],
        "globals": {
            "TARGET": "webclient"
        },
    };
};
