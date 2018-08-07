var gulp = require("gulp");

var del = require("del");

const delJS = (done) => {
    return del("./dist/scripts/**/*", done);
};

const delCSS = (done) => {
    return del("./dist/styles/**/*", done);
};

const delHTML = (done) => {
    return del("./*.html", done);
};

var browserify = require("browserify");
var babelify = require("babelify");
var source = require("vinyl-source-stream");
var buffer = require("vinyl-buffer");
var es = require("event-stream");
var glob = require("glob");
var uglify = require("gulp-uglify");

const buildJS = (done) => {
    glob("./scripts/global-**.js", (err, files) => {
        if (err || files == null) {
            done(err);
            return;
        }

        es.merge(files.map((entry) =>
            browserify({
                extensions: [".js"],
                entries: [entry],
                transform: [
                    babelify.configure({
                        compact: true,
                        comments: false
                    })
                ]
            })
                .bundle()
                .pipe(source(entry.replace(/.+\/global-([^\/]+)\..+$/, "$1.js")))
                .pipe(buffer())
                .pipe(uglify())
                .pipe(gulp.dest("./dist/scripts"))
        )).on("end", done);
    });
};

var rename = require("gulp-rename");
var postcss = require("gulp-postcss");
var cssmin = require("gulp-cssmin");

const buildCSS = (done) => {
    glob("./styles/global-**.css", (err, files) => {
        if (err || files == null) {
            done(err);
            return;
        }

        es.merge(files.map((entry) =>
            gulp.src(entry)
                .pipe(postcss(
                    [
                        "postcss-clearfix",
                        "postcss-color-short",
                        "postcss-cssnext",
                        "postcss-hidden",
                        "postcss-short",
                    ].map((processor) => require(processor))
                ))
                .pipe(rename(entry.replace(/.+\/global-([^\/]+)\..+$/, "$1.css")))
                .pipe(cssmin())
                .pipe(gulp.dest("./dist/styles/"))
        )).on("end", done);
    });
};

var handlebars = require("gulp-compile-handlebars");
var htmlmin = require("gulp-htmlmin");

const buildHTML = (done) => {
    glob("./templates/*.handlebars", (err, files) => {
        if (err || files == null) {
            done(err);
            return;
        }
        
        es.merge(files.map((entry) =>
            gulp.src(entry)
                .pipe(handlebars({}, {
                    batch: ["./templates/partials"]
                }))
                .pipe(rename(entry.replace(/.+\/([^\/]+)\..+$/, "$1.html")))
                .pipe(htmlmin({collapseWhitespace: true}))
                .pipe(gulp.dest("./"))
        )).on("end", done);
    });
};

gulp.task("build-js", gulp.series(delJS, buildJS));
gulp.task("build-html", gulp.series(delHTML, buildHTML));
gulp.task("build-css", gulp.series(delCSS, buildCSS));
gulp.task("build", gulp.parallel("build-js", "build-html", "build-css"));
gulp.task("default", gulp.parallel("build"));
