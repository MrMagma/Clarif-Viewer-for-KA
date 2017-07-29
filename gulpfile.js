var gulp = require("gulp");

var del = require("del");

gulp.task("del-js", function() {
    return del.sync("./dist/scripts/**/*");
});

gulp.task("del-css", function() {
    return del.sync("./dist/styles/**/*");
});

gulp.task("del-html", function() {
    return del.sync("./*.html");
});

var browserify = require("browserify");
var babelify = require("babelify");
var source = require("vinyl-source-stream");
var buffer = require("vinyl-buffer");
var util = require("gulp-util");
var es = require("event-stream");
var glob = require("glob");
var uglify = require("gulp-uglify");

gulp.task("build-js", ["del-js"], function(done) {
    glob("./scripts/global-**.js", function(err, files) {
        if (err) {
            done(err);
            return;
        }

        if (files == null) {
            done();
            return;
        }

        var tasks = files.map(function(entry) {
            var babelCfg = {
                // compact: true,
                compact: false,
                comments: false
            };

            var rename = /\/global-([^\/]+)\..+$/.exec(entry)[1] + ".js";

            return browserify({
                extensions: [".js"],
                entries: [entry],
                transform: [
                    babelify.configure(babelCfg)
                ]
            })
                .bundle()
                .pipe(source(rename))
                .pipe(buffer())
                // .pipe(uglify())
                .pipe(gulp.dest("./dist/scripts"));
        });

        task = es.merge(tasks).on("end", done);
    });
});

var rename = require("gulp-rename");
var postcss = require("gulp-postcss");
var cssmin = require("gulp-cssmin");

gulp.task("build-css", ["del-css"], function(done) {
    glob("./styles/global-**.css", function(err, files) {
        if (err) {
            done(err);
            return;
        }

        if (files == null) {
            done();
            return;
        }
        var tasks = files.map(function(entry) {
            var name = /\/global-([^\/]+)\..+$/.exec(entry)[1] + ".css";

            return gulp.src(entry)
                .pipe(postcss([
                        "postcss-clearfix",
                        "postcss-color-short",
                        "postcss-cssnext",
                        "postcss-hidden",
                        "postcss-short",
                ].map(function(processor) {
                    return require(processor);
                })))
                .pipe(rename(name))
                .pipe(cssmin())
                .pipe(gulp.dest("./dist/styles/"));
        });

        task = es.merge(tasks).on("end", done);
    });
});

var handlebars = require("gulp-compile-handlebars");
var htmlmin = require("gulp-htmlmin");

gulp.task("build-html", ["del-html"], function(done) {
    glob("./templates/*.handlebars", function(err, files) {
        if (err) {
            done(err);
            return;
        }

        if (files == null) {
            done();
            return;
        }
        var tasks = files.map(function(entry) {
            var name = /\/([^\/]+)\..+$/.exec(entry)[1] + ".html";

            return gulp.src(entry)
                .pipe(handlebars({}, {
                    batch: ["./templates/partials"]
                }))
                .pipe(rename(name))
                .pipe(htmlmin({collapseWhitespace: true}))
                .pipe(gulp.dest("./"));
        });

        task = es.merge(tasks).on("end", done);
    });
});

gulp.task("build", ["build-css", "build-js", "build-html"]);

gulp.task("default", ["build"]);
