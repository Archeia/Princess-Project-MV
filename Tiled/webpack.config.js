const path = require('path');
const fs = require('fs');
const webpack = require('webpack');

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (...relativePath) => path.resolve(appDirectory, ...relativePath);

module.exports = {
    mode: 'development',
    entry: {
        YED_Tiled: resolveApp('Source Code/index.js'),
    },
    output: {
        path: resolveApp('Compiled Code/build'),
        filename: '[name].js',
    },
    plugins: [
        new webpack.BannerPlugin({
            banner: () => `${fs.readFileSync(resolveApp('Source Code/header.js'), 'utf8')}
var Imported = Imported || {};
Imported.YED_Tiled = true;
`,
            raw: true,
        }),
    ],
};