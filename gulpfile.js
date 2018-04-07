/**
 * Author: Afdallah Wahyu Arafat <afdallah.war@gmail.com>
 * Source: https://github.com/afdallah/AutoWP
 */

var gulp = require('gulp')
var plumber = require('gulp-plumber')
var sass = require('gulp-sass')
var prefixer = require('gulp-autoprefixer')
var sourcemaps = require('gulp-sourcemaps')
var uglify = require('gulp-uglify')
var minifyCss = require('gulp-uglifycss')
var concat = require('gulp-concat')
var cache = require('gulp-cache')
var imagemin = require('gulp-imagemin')
var browserSync = require('browser-sync').create()
var rename = require('gulp-rename')
var del = require('del')
var zip = require('gulp-zip')
var runSequence = require('run-sequence')
var notify = require('gulp-notify')

var config = {
  projectName: 'Nusathemes',
  version: '1.0.0',
  projectDir: './',
  projectURL: 'nusathemes.dev'
}

// Zip file name
var pkgName = `${config.projectName}-${config.version}`

// Path
var rootDir = './'
var srcDir = './source'
var distDir = rootDir

var buildInclude = [
  // include common file types
  '**/*.php',
  '**/*.html',
  '**/*.css',
  '**/*.js',
  '**/*.svg',
  '**/*.ttf',
  '**/*.otf',
  '**/*.eot',
  '**/*.woff',
  '**/*.woff2',

  // include specific files and folders
  'screenshot.png',

  // exclude files and folders
  '!node_modules/**/*',
  '!source/**/*',
  '!assets/js/custom/*',
  '!*.map',
  '!.git',
  '!.gitignore',
  '!package.json',
  '!gulpfile.js',
  '!maps/**/*',
  '!assets/js/custom/*',
  '!' + pkgName + '/**/*'
]

var path = {
  html: './**/*.html',
  php: './**/*.php',
  sass: {
    src: './source/sass/**/*.scss',
    dest: './assets/css'
  },
  js: {
    src: './assets/js/custom/**/*.js',
    vendorSrc: './assets/js/vendor/**/*.js',
    dest: './assets/js/'
  },
  img: {
    src: './assets/img/raw/**/*.{jpg, png, svg, jpeg}',
    dest: './assets/img/'
  }
}

// SASS Task
gulp.task('sass', function () {
  return gulp.src(path.sass.src)
    // Plumber prevent stream to stop when error happens
    .pipe(plumber({
      errorHandler: function (err) {
        notify.onError({
          title: `Gulp error in ` + err.plugin,
          subtitle: 'Error',
          message: err.toString(),
          sound: `Beep`
        })(err)
      }
    }))

    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'expanded'
    }).on('error', sass.logError))
    .pipe(prefixer({
      browsers: ['last 2 versions']
    }))

    // Passing argument '' to sourcmaps.write will make sourcmaps separate from *.css
    .pipe(sourcemaps.write('maps'))
    .pipe(gulp.dest(path.sass.dest))
    .pipe(browserSync.reload({
      stream: true
    }))

    .pipe(minifyCss())
    .pipe(rename({ suffix: '.min' }))
    .pipe(browserSync.reload({ stream: true }))
    .pipe(gulp.dest(path.sass.dest))
})

// Vendors Task
gulp.task('vendorsJs', function () {
  gulp.src(path.js.vendorSrc)
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest(path.js.dest))
    .pipe(rename({
      basename: 'vendor',
      suffix: '.min'
    }))
    .pipe(uglify())
    .pipe(gulp.dest(path.js.dest))
})

// CustomJs Task
gulp.task('customJs', function () {
  gulp.src(path.js.src)
    .pipe(concat('custom.js'))
    .pipe(gulp.dest(path.js.dest))
    .pipe(rename({
      basename: 'custom',
      suffix: '.min'
    }))
    .pipe(uglify())
    .pipe(gulp.dest(path.js.dest))
})

// Image Task
gulp.task('images', function () {
  gulp.src(path.img.src)
    .pipe(cache(imagemin([
      imagemin.gifsicle({
        interlaced: true
      }),
      imagemin.jpegtran({
        progressive: true
      }),
      imagemin.optipng({
        optimizationLevel: 7
      }), // max optmization
      imagemin.svgo({
        plugins: [{
          removeViewBox: true
        }]
      })
    ], {
      verbose: true
    })))
    .pipe(gulp.dest(path.img.dest))
    .pipe(notify({
      title: 'Gulp Notification',
      subtitle: 'Gulp - Success',
      message: 'Image Task, completed! No error found.\n Output: <%= file.relative %>',
      onLast: true
    }))
})

// Browser Sync
gulp.task('serve', function () {
  browserSync.init({
  // server: {
    // baseDir: './',
  // },

    open: true,
    proxy: config.projectURL, // or project.dev/app/
    port: 3000
  })
})

// Clear Cache task
gulp.task('clearCache', function () {
  cache.clearAll()
})

// Cleanup
gulp.task('clean', function () {
  // You can use multiple globbing patterns as you would with `gulp.src`
  return del(['**/.sass-cache', '**./DS_Store', '**/*.swp', '**/*.swap', '**/*.zip', '**/*.rar'])
})

gulp.task('buildFiles', function () {
  return gulp.src(buildInclude)
    .pipe(gulp.dest(pkgName))
})

gulp.task('buildImages', function () {
  return gulp.src(['assets/img/**/*', '!assets/images/raw/**'])
    .pipe(gulp.dest(pkgName + '/assets/img/'))
})

gulp.task('makezip', function () {
  return gulp.src(pkgName + '/**/*')

    .pipe(zip(pkgName + '.zip'))
    .pipe(gulp.dest(rootDir))
    .pipe(notify({
      title: config.projectName,
      subtitle: config.projectName,
      message: 'Bundling Project Completed. Output file: <%= file.relative %>',
      sound: 'Pop',
      onLast: true
    }))
})

// Bundle Task
gulp.task('bundle', function (cb) {
  runSequence('clean', 'clearCache', 'sass', 'vendorsJs', 'customJs', 'images', 'buildFiles', 'buildImages', 'makezip', cb)
})

// Default task
gulp.task('default', ['sass', 'vendorsJs', 'customJs', 'images', 'serve'], function () {
  gulp.watch(path.php, browserSync.reload) // Reload on PHP file changes.
  gulp.watch(path.sass.src, ['sass']) // Reload on SCSS file changes.
  gulp.watch(path.js.src, ['customJs'], browserSync.reload) // Reload on SCSS file changes.
  gulp.watch(path.js.vendorSrc, ['vendorsJs'], browserSync.reload) // Reload on SCSS file changes.
})
