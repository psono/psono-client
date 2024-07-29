const workboxBuild = require('workbox-build');
const webpack = require('webpack');

const buildSW = () => {
    workboxBuild
        .injectManifest({
            swSrc: 'src/webclient/data/service-worker.js',
            swDest: 'build/service-worker.js',
            globDirectory: 'build/webclient/',
            globPatterns: [
                '**/*'
            ],
            globIgnores: [
                '**/*.map'
            ],
            compileSrc: true,
            maximumFileSizeToCacheInBytes: 20000000,
            webpackCompilationPlugins: [
                new webpack.DefinePlugin({
                    CACHE_VERSION: JSON.stringify("test!")
                })
            ]
        })
        .then(({ count, size, warnings }) => {
            // Optionally, log any warnings and details.
            warnings.forEach(console.warn);
            console.log(`${count} files will be precached, totaling ${size} bytes.`);
        })
        .catch(console.error);
};
buildSW();