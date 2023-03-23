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
const fileName = 'ui-vts.css'

const themePath = "./src/ui-vts.less"
const themeContent = `
@import '${themePath}';
`;

function compileLess(cb) {
    less.render(themeContent, {
        javascriptEnabled: true,
        plugins: [new LessPluginCleanCSS({ advanced: true })]
    }).then(data => {
        fs.writeFile(path.join(outDir, `${fileName}`), data.css);
        cb()
    }).catch(e => {
        console.log(e);
    });
}

function copyStyles() {
    return src('src/**').pipe(dest(outDir))
}

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
        @import './patch/index';
        @import './style/core/index';
        @import './variables-<%= theme %>';
        @import './components/index';
    `
    const variableTemplate = `
        @import "./style/color/colors";
        @import "./style/themes/<%= theme %>";
    `

    return src('src/style/themes/*.less', {base: './'})
        .pipe(gulpTap((file) => {
            const withoutExt = file.basename.replace(file.extname, '')
            const theme = withoutExt
            const themeContent = _.template(themeTemplate)({theme})
            const themeFile = `${withoutExt}.less`
            const variableContent = _.template(variableTemplate)({theme})
            const variableFile = `variables-${withoutExt}.less`
            fs.writeFileSync(path.join('src', themeFile), themeContent.replace(/ /g, '').trim())
            fs.writeFileSync(path.join('src', variableFile), variableContent.replace(/ /g, '').trim())
        }))
}

function generateDefault(d) {
    const defaultContent = `@import "./default";`
    const variableContent = `@import "./variables-default";`
    fs.writeFileSync(path.join('src', 'ui-vts.less'), defaultContent)
    fs.writeFileSync(path.join('src', 'variables.less'), variableContent)
    d()
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
    copyStyles,
    compileLess,
    copyPackageJson
))