// 实现这个项目的构建任务
const { src, dest, series, parallel, watch } = require('gulp')
const loadPlugins = require('gulp-load-plugins')
const plugins = loadPlugins()
const del = require('delete')
const browsersync = require('browser-sync')
const bs = browsersync.create()

// const babel = require("gulp-babel");
// const uglify = require("gulp-uglify");
// const htmlmin = require('gulp-htmlmin')
// const plgCleanCss = require('gulp-clean-css')
// const plgSass = require('gulp-sass')
// const plgRaname = require('gulp-rename')
// const plgSwig = require('gulp-swig')
// const plgImageMin = require('gulp-imagemin')
// const useref = require('gulp-useref)   // 可以将HTML引用的多个CSS和JS合并起来，减小依赖的文件个数，从而减少浏览器发起的请求次数。
// const gulpif = require('gulp-if')

/**
 * series : 按序执行
 * parallel: 并行
 *
 *
 *
  "clean": "gulp clean",
  "lint": "gulp lint",
  "serve": "gulp serve",
  "build": "gulp build",
  "start": "gulp start",
  "deploy": "gulp deploy --production"
 */

const data = {
  menus: [{ name: 1 }, { name: 2 }],
  pkg: require('./package.json'),
  date: new Date(),
}

// js文件编译压缩
const jsTranspile = () => {
  return src('src/**/*.js', { base: 'src' })
    .pipe(plugins.babel({ presets: ['@babel/preset-env'] }))
    .pipe(plugins.uglify())
    .pipe(dest('temp'))
}
// 处理scss文案
const cssTranspile = () => {
  return src('src/**/*.scss', { base: 'src' })
    .pipe(plugins.sass({ outputStyle: 'expanded' }))
    .pipe(plugins.cleanCss())
    .pipe(dest('temp'))
}
// 处理 html模版文件
const pageTranspile = () => {
  return (
    src('src/**/*.html', { base: 'src' })
      .pipe(plugins.swig({ defaults: { cache: false }, data }))
      // .pipe(plugins.useref())
      .pipe(dest('temp'))
  )
}
// 处理图片文件
const imgTranspile = () => {
  return src('src/assets/images/**', { base: 'src' }).pipe(plugins.imagemin()).pipe(dest('dist'))
}
// 处理字体文件svg会压缩
const fontTranspile = () => {
  return src('src/assets/fonts/**', { base: 'src' }).pipe(plugins.imagemin()).pipe(dest('dist'))
}
// 额外文件复制到dist
const extraFile = () => {
  return src('public/**', { base: './' }).pipe(dest('dist'))
}

// 处理dist目录下 html 里的   js css  的引用链接哦
// 先执行compile任务 再执行userefOut 不然 html文件内没有注释了  执行userefOut 不会有用js 和 css 的文件生成 就不会执行 相关压缩
const userefOut = () => {
  return src('temp/**.html', {
    base: 'temp',
  })
    .pipe(plugins.useref({ searchPath: ['temp', '.'] }))
    .pipe(
      plugins.if(
        '*.html',
        plugins.htmlmin({
          collapseWhitespace: true,
          minfyCss: true,
          minfyJs: true,
        })
      )
    )
    .pipe(plugins.if('*.js', plugins.uglify()))
    .pipe(plugins.if('*.css', plugins.cleanCss()))
    .pipe(dest('dist'))
}

// 清理dist目录
const clean = cb => {
  del(['./dist', './temp'], cb)
}

// 启动服务 browsersync
const serve = () => {
  watch('src/**/*.js', jsTranspile)
  watch('src/**/*.scss', cssTranspile)
  watch('src/**/*.html', pageTranspile)
  // watch("src/assets/images/**", imgTranspile);
  // watch("src/assets/fonts/**", fontTranspile);
  // watch("public/**", extraFile);
  watch(['src/assets/images/**', 'src/assets/fonts/**', 'public/**'], bs.reload)
  bs.init({
    open: false,
    port: 2080,
    // notify: false,
    files: ['temp/**'],
    server: {
      baseDir: ['temp', 'src', 'public'], // 多个基目录 会逐级寻找
      routes: {
        '/node_modules': 'node_modules',
      },
    },
  })
}

const lint = function (cb) {
  cb(new Error('boom'))
}

const deploy = function (cb) {
  if (process.env.NODE_ENV === 'production') {
    cb(new Error('boom'))
  } else {
    cb(new Error('boom'))
  }
}

// 开发 编译任务处理 js scss html ...
//（img font 额外文件 放入build里去执行 开发不需要没次都构建这些）
const compile = parallel(jsTranspile, cssTranspile, pageTranspile)
// 开发调试
const start = series(compile, serve)
// 构建生成 dist目录文件 前清理后编译 上线之前
// img font 和额外文件在开发阶段不去编译可以减少没次更改的后的编译时长
const build = series(clean, parallel(series(compile, userefOut), imgTranspile, fontTranspile, extraFile))

module.exports = {
  clean,
  lint,
  serve,
  build,
  start,
  deploy,
}
