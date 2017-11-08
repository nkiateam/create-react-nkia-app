const webpack = require('webpack');
const path = require('path');
const os = require('os');
const autoprefixer = require('autoprefixer');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// const appDirectory = fs.realpathSync(process.cwd());
const appDirectory = process.cwd();
const TEMP_TYPE = process.env.TEMP_TYPE ? process.env.TEMP_TYPE : 'template';
let excludeModule = '';
let port = 3000;

const resolveApp =  relativePath => {
    
    if(process.env.NODE_ENV === 'development') {
        _path = path.resolve(appDirectory, 'packages/polestar-template', TEMP_TYPE, relativePath);
    }else if(process.env.NODE_ENV === 'production') {
        _path = path.resolve(appDirectory, 'node_modules/polestar-template', TEMP_TYPE, relativePath);
        excludeModule = '!polestar-template';
        port = 4000;
    }else {
        _path = path.resolve(appDirectory, relativePath);
    }
    
    return _path;
}

module.exports = {
	entry: {
		app: resolveApp('src/index.js')
    },
    
	output: {
        filename: '[name].js',
		path: resolveApp('build'),
        publicPath: '/'
    },

    devtool: 'inline-source-map',

	module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: [
                    path.resolve(__dirname, 'node_modules', excludeModule)
                ],
                loader: 'babel-loader',
                options: {
                    extends: path.resolve(__dirname, '.babelrc')
                }
            },
            {
                test: /\.css$/,
                use: [
                    require.resolve('style-loader'),
                    {
                        loader: require.resolve('css-loader'),
                        options: {
                            importLoaders: 1,
                        },
                    },
                    {
                        loader: require.resolve('postcss-loader'),
                        options: {
                            ident: 'postcss', // https://webpack.js.org/guides/migrating/#complex-options
                            plugins: () => [
                                require('postcss-flexbugs-fixes'),
                                autoprefixer({
                                    browsers: [
                                        '>1%',
                                        'last 4 versions',
                                        'Firefox ESR',
                                        'not ie < 9', // React doesn't support IE8 anyway
                                    ],
                                    flexbox: 'no-2009',
                                }),
                            ],
                        },
                    },
                ],
            },
            // file-loader
            {
                exclude: [
                    /\.html$/,
                    /\.(js|jsx)$/,
                    /\.css$/,
                    /\.json$/,
                    /\.bmp$/,
                    /\.gif$/,
                    /\.jpe?g$/,
                    /\.png$/,
                ],
                loader: require.resolve('file-loader'),
                options: {
                    name: 'static/media/[name].[hash:8].[ext]',
                },
            },
            // url-loader
            {
                test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
                loader: require.resolve('url-loader'),
                options: {
                    limit: 10000,
                    name: 'static/media/[name].[hash:8].[ext]',
                },
            },
        ]
    },

    resolve: {
        alias: {
            RouteWithSubRoutes: resolveApp('src/routes/RouteWithSubRoutes.js'),
            commons: resolveApp('src/commons/'),
            pages: resolveApp('src/pages/'),
            styles: resolveApp('src/styles/')
        }
    },

    plugins: [
        new HtmlWebpackPlugin({
            inject: true,
            template: resolveApp('src/index.html'),
        }),
    ],
    devServer: {
        inline: true,
        host: '127.0.0.1',
        port: port,
        contentBase: resolveApp(''),
        historyApiFallback: true,
    }
};
