module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            big: {
                options: {
                    banner: '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> - <%= pkg.homepage %> */\n',
                    sourceMap: false,
                    compress: false,
                    mangle: false,
                    beautify: true,
                    preserveComments: true
                },
                files: {
                    'build/<%= pkg.name %>.<%= pkg.version %>.js': ['lib/faml/*.js']
                }
            },
            min: {
                options: {
                    banner: '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> - <%= pkg.homepage %> - See LICENSE */\n',
                    sourceMap: true,
                    sourceMapIncludeSources: true,
                },
                files: {
                    'build/<%= pkg.name %>.<%= pkg.version %>.min.js': ['lib/faml/*.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', ['uglify:big', 'uglify:min']);
};