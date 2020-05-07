// 引入工具
var gulp              = require('gulp');
var $                 = require('gulp-load-plugins')();
var autoprefixer      = require('autoprefixer');
var pxtorem           = require('postcss-pxtorem');
var nano              = require('cssnano');
var minimist          = require('minimist');
var mainBowerFiles    = require('main-bower-files');
var connectPhp        = require('gulp-connect-php');
var browserSync       = require('browser-sync').create();

// gulp --env production Compressed output
var envOption         = {string: 'env',default: { env: 'develop' }}
var options           = minimist(process.argv.slice(2), envOption);
console.log(options)

var paths = {
    asp: {
        src: './source/**/*.pug',
        dest: './public/'
    },
    script: {
        src: './source/js/*.js',
        dest: './public/js'
    },
    plugin: {
        src: './source/js/plugin/*.*',
        dest: './public/js/plugin'
    },
    sass: {
        src: './source/sass/**/*.{scss,sass}',
        dest: './public/css'
    },
    css: {
        src: './source/sass/**/*.css',
        dest: './public/css'
    },
    imagemin: {
        src: './source/images/**/*.*',
        dest: './public/images'
	},
	tinyimg: {
        src: './source/images/**/*.*{jpg,jpeg,png}',
        dest: './public/images'
    },
    fonts: {
        src: './source/fonts/**/*.*',
        dest: './public/fonts'
    },
    clear: {
        src: './public/'
    },
};

// ASP
function asp() {
    const htmlOpt = {
        removeComments: false, // 清除HTML註釋
        collapseWhitespace: false, // 壓縮HTML
        collapseBooleanAttributes: true, // 省略布爾屬性的值 <input checked="true"/> ==> <input />
        removeEmptyAttributes: true, // 刪除所有空格作屬性值 <input id="" /> ==> <input />
        removeScriptTypeAttributes: true, // 刪除<script>的type="text/javascript"
        removeStyleLinkTypeAttributes: true, // 刪除<style>和<link>的type="text/css"
        // sortAttributes: true, // 按頻率對屬性進行排序
        // sortClassName: true, // 按頻率對樣式進行排序
        minifyJS: false, // 壓縮頁面JS
        minifyCSS: true // 壓縮頁面CSS
    };
    return gulp.src(paths.asp.src)
        // for pug
        .pipe($.plumber())
        .pipe($.pug({
            pretty: true
        }))
        .pipe($.rename({
            extname: '.asp'
        }))
        // for pug end
        .pipe($.if(options.env === 'production', $.htmlmin(htmlOpt)))
        .pipe(gulp.dest(paths.asp.dest))
        .pipe(browserSync.stream());
};

// SASS
function sass() {  
    var plugins = [
        autoprefixer({ browsers: ['last 3 version', '>5%', 'ie 8'] }),
        pxtorem({replace: false}),
        nano({preset: 'default'}),
    ];
    return gulp.src(paths.sass.src)
        .pipe($.plumber())
        .pipe($.sourcemaps.init())
        // 前譯 css
        .pipe($.sass({
            errLogToConsole: true,
            outputStyle: 'expanded'
        }).on('error', $.sass.logError))
        // 後譯 css
        .pipe($.postcss(plugins))
        // 壓縮 css // if it is production
        .pipe($.if(options.env === 'production', $.cleanCss()))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest(paths.sass.dest))
        .pipe(browserSync.stream());
};

function css() {  
    return gulp.src(paths.css.src)
        .pipe(gulp.dest(paths.css.dest))
};

// JS
function script() {
    return gulp.src(paths.script.src)
        .pipe($.sourcemaps.init())
        .pipe($.babel({ presets: ['@babel/env'] }))
        // 壓縮 js // if it is production
        // .pipe($.if(options.env === 'production', $.terser({
        .pipe($.if(options.env === 'production', $.uglify({compress: {
                // 移除測試
                drop_console: true
            }
        })))
        .pipe(gulp.dest(paths.script.dest))
        .pipe(browserSync.stream());
};

function plugin() {  
    return gulp.src(paths.plugin.src)
        .pipe(gulp.dest(paths.plugin.dest))
};


function fonts() {  
    return gulp.src(paths.fonts.src)
        .pipe(gulp.dest(paths.fonts.dest))
};

// BULID PHP SERVICE
function sync() {
    connectPhp.server({base: './public/', port: 3000, keepalive: true}, function () {browserSync.init({proxy: 'localhost:84',watch: true,open: true,notify: false});});
};

// 監控 GULP
function watch() {
    gulp.watch(paths.asp.src, asp);
    gulp.watch(paths.sass.src, sass);
    gulp.watch(paths.script.src, script);
};

// 圖片壓縮
function imagemin() {
    return gulp.src(paths.imagemin.src)
        .pipe($.if(options.env === 'production', $.imagemin()))
        .pipe(gulp.dest(paths.imagemin.dest))
};

//pandaPNG 
function tinypng() {
    return gulp.src(paths.tinyimg.src)
        // tinypng金鑰授權: 500張/月
        .pipe($.tinypng('jDyzH5G5wrWDVT3tXRKtrF8CBL0mLzNj'))
        .pipe(gulp.dest(paths.tinyimg.dest))
};

// 清除資料夾指令
function clean() {
    // return gulp.src(paths.clear.src, { read: false })
    return gulp.src(paths.clear.src, { read: false })
        .pipe($.clean());
}

// You can use CommonJS `exports` module notation to declare tasks
exports.asp      = asp;
exports.sass     = sass;
exports.css      = css;
exports.script   = script;
exports.plugin   = plugin;
exports.imagemin = imagemin;
exports.tinypng  = tinypng;
exports.watch    = watch;
exports.sync     = sync;
exports.clean    = clean;

// Specify if tasks run in series or parallel using `gulp.series` and `gulp.parallel`
// COMPLETE DELIVERY, enter: gulp build --env production
var build = gulp.series(clean, asp, plugin, script, css, sass, fonts, imagemin);
gulp.task('build', build);
// gulp.task('build', buildCss);

// DEVELOPER MODE, enter: gulp
var working = gulp.parallel(asp, script, plugin, css, sass, sync, fonts, imagemin, watch);
gulp.task('default', working);