const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    resolve: {
        alias: {
            assets: `${__dirname}/src/assets`,
            components: `${__dirname}/src/components`,
            services: `${__dirname}/src/services`,
            store: `${__dirname}/src/store`
        }
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: "paradisec-data-loader",
            template: "src/renderer/index.html",
            hash: true
        })
    ]
};
