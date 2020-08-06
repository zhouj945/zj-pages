// 实现这个项目的构建任务
const { src, dest, series, parallel, watch } = require('gulp')
const loadPlugins = require('gulp-load-plugins')
const plugins = loadPlugins()
const del = require('delete')
const browsersync = require('browser-sync')
const bs = browsersync.create()
const cwd = process.cwd() // 返回当前命令行的工作目录
// 配置大于约定
let config = {
  build: {
    src: 'src',
    dist: 'dist',
    temp: 'temp',
    public: 'public',
    images: 'src/assets/images/**',
    fonts: 'src/assets/fonts/**',
  },
}
try {
  const loadConfig = require(`${cwd}/pages.config.js`)
  config = Object.assign({}, config, loadConfig)
} catch (error) {}
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

// js文件编译压缩
const jsTranspile = () => {
  return src(`${config.build.src}/**/*.js`, { base: config.build.src })
    .pipe(plugins.babel({ presets: [require('@babel/preset-env')] })) // '@babel/preset-env' 模块再zj-pages里去寻找 require会逐级向上再nod_modules里找
    .pipe(plugins.uglify())
    .pipe(dest(config.build.temp))
}
// 处理scss文案
const cssTranspile = () => {
  return src(`${config.build.src}/**/*.scss`, { base: config.build.src })
    .pipe(plugins.sass({ outputStyle: 'expanded' }))
    .pipe(plugins.cleanCss())
    .pipe(dest(config.build.temp))
}
// 处理 html模版文件
const pageTranspile = () => {
  return src(`${config.build.src}/**/*.html`, { base: config.build.src })
    .pipe(plugins.swig({ defaults: { cache: false }, data: config.data }))
    .pipe(dest(config.build.temp))
}
// 处理图片文件
const imgTranspile = () => {
  return src(config.build.images, { base: config.build.src }).pipe(plugins.imagemin()).pipe(dest(config.build.dist))
}
// 处理字体文件svg会压缩
const fontTranspile = () => {
  return src(config.build.fonts, { base: config.build.src }).pipe(plugins.imagemin()).pipe(dest(config.build.dist))
}
// 额外文件复制到dist
const extraFile = () => {
  return src(`${config.build.public}/**`, { base: './' }).pipe(dest(config.build.dist))
}

// 处理dist目录下 html 里的   js css  的引用链接哦
// 先执行compile任务 再执行userefOut 不然 html文件内没有注释了  执行userefOut 不会有用js 和 css 的文件生成 就不会执行 相关压缩
const userefOut = () => {
  return src(`${config.build.temp}/**.html`, {
    base: config.build.temp,
  })
    .pipe(plugins.useref({ searchPath: [config.build.temp, '.'] }))
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
    .pipe(dest(config.build.dist))
}

// 清理dist目录
const clean = cb => {
  del([config.build.dist, config.build.temp], cb)
}

// 启动服务 browsersync
const serve = () => {
  watch(`${config.build.src}/**/*.js`, jsTranspile)
  watch(`${config.build.src}/**/*.scss`, cssTranspile)
  watch(`${config.build.src}/**/*.html`, pageTranspile)
  // watch("src/assets/images/**", imgTranspile);
  // watch("src/assets/fonts/**", fontTranspile);
  // watch("public/**", extraFile);
  watch([config.build.images, config.build.fonts], bs.reload)
  watch(`**`, { cwd: config.build.public }, bs.reload) // 命令行当前目录 + xxx
  bs.init({
    open: false,
    port: 2080,
    // notify: false,
    files: [`${config.build.temp}/**`],
    server: {
      baseDir: [config.build.temp, config.build.src, config.build.public], // 多个基目录 会逐级寻找
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
