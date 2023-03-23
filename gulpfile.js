const { series, task, src, dest } = require('gulp')
const gulpClean = require('gulp-clean');
const gulpReplace = require('gulp-replace');
const gulpFilter = require('gulp-filter');
const gulpRename = require('gulp-rename');
const gulpTap = require('gulp-tap');
const jsonEdit = require('gulp-json-editor')
const less = require('less');
const LessPluginCleanCSS = require('less-plugin-clean-css');
const fs = require('fs-extra');
const path = require('path')
const _ = require('lodash')

const currentDir = __dirname
const outDir = path.join(currentDir, 'dist')

function copyPackageJson() {
    return src('package.json')
            .pipe(jsonEdit({
                main: "",
                scripts: Object,
                devDependencies: Object
            }))
            .pipe(jsonEdit((json) => {
                delete json.exports
                return json
            }))
            .pipe(dest(outDir))
}

function clean() {
    return src(outDir, { read: false, allowEmpty: true }).pipe(gulpClean(null));
}

function extract() {
    return src('extract/**', {base: './'})
        .pipe(gulpFilter(function(path) {
            return /extract\\([a-z\-])+\\style/.test(path.dirname)
        }))
        .pipe(gulpRename(function(path) {
            path.dirname = path.dirname.replace(/extract\\/g, '')
        }))
        .pipe(gulpReplace('../../style/', '../../../style/'))
        .pipe(dest('extracted'))
}

function cleanGenerate() {
    return src('src/*.less', {base: './'})
        .pipe(gulpClean(null))
}

function generateTheme() {
    const themeTemplate = `
        @import './patch/index.less';
        @import './style/core/index.less';
        @import './variables-<%= theme %>.less';
        @import './components/index.less';
    `
    const variableTemplate = `
        @import "./style/color/colors.less";
        @import "./style/themes/<%= theme %>.less";
    `

    return src('src/style/themes/*.less', {base: './'})
        .pipe(gulpTap((file) => {
            const withoutExt = file.basename.replace(file.extname, '')
            const theme = withoutExt
            const themeContent = _.template(themeTemplate)({theme})
            const themeFile = `theme-${theme}.less`
            const variableContent = _.template(variableTemplate)({theme})
            const variableFile = `variables-${theme}.less`
            fs.writeFileSync(path.join('src', themeFile), themeContent.replace(/  /g, '').trim())
            fs.writeFileSync(path.join('src', variableFile), variableContent.replace(/  /g, '').trim())
        }))
}

function generateDefault(d) {
    const defaultContent = `@import "./theme-default.less";`
    const variableContent = `@import "./variables-default.less";`
    fs.writeFileSync(path.join('src', 'ui-vts.less'), defaultContent)
    fs.writeFileSync(path.join('src', 'variables.less'), variableContent)
    d()
}

function compileTheme(cb) {
    return src([
        path.join(outDir, 'theme-*.less'),
        path.join(outDir, 'ui-vts.less')
    ], {base: './'})
        .pipe(gulpTap(async (file) => {
            try {
                const data = await less.render(
                    fs.readFileSync(file.path).toString(),
                    {
                        javascriptEnabled: true,
                        plugins: [new LessPluginCleanCSS({ advanced: true })],
                        paths: [file.dirname]
                    }
                )
                fs.writeFileSync(path.join(outDir, file.basename.replace('.less', '.css')), data.css)
            } catch (e) {
                console.log(e)
                throw e
            }
        }))
}

function copyStyles() {
    return src('src/**/*.less').pipe(dest(outDir))
}

task('extract', series(
    extract
))

task('generate', series(
    cleanGenerate,
    generateTheme,
    generateDefault
))

task('build', series(
    clean,
    "generate",
    copyStyles,
    copyPackageJson,
    compileTheme
))