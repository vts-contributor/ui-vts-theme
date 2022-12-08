const { series, task, src, dest } = require('gulp')
const gulpClean = require('gulp-clean');
const gulpReplace = require('gulp-replace');
const gulpFilter = require('gulp-filter');
const gulpRename = require('gulp-rename');
const jsonEdit = require('gulp-json-editor')
const less = require('less');
const LessPluginCleanCSS = require('less-plugin-clean-css');
const fs = require('fs-extra');
const path = require('path')

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

task('extract', series(
    extract
))

task('build', series(
    clean,
    copyStyles,
    compileLess,
    copyPackageJson
))