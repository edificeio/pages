var webpack = require('webpack');
var path = require('path');

module.exports = {
    entry: {
        application: './src/main/resources/public/temp/app.js',
        behaviours: './src/main/resources/public/temp/behaviours.js'
    },
    output: {
        filename: '[name].js',
        path: __dirname + 'dest'
    },
    externals: {
        "entcore/entcore": "entcore",
        "entcore": "entcore",
        "entcore/libs/moment/moment": "entcore",
        "entcore/libs/underscore/underscore": "_",
        "entcore/libs/jquery/jquery": "entcore",
        "angular": "angular"
    },
    resolve: {
        modulesDirectories: ['bower_components', 'node_modules'],
        root: path.resolve(__dirname),
        extensions: ['', '.js'],
        alias: {
            'sass.js': path.resolve('./bower_components/sass.js/dist/sass.js')
        }
    },
    devtool: "source-map",
    module: {
        preLoaders: [
            {
                test: /\.js$/,
                loader: 'source-map-loader'
            }
        ]
    }
}