(function() {
    
    var FilterTree = (function() {
        
        function FilterTree(name) {
            this.name = name;
            this.children = {};
            this.entries = 0;
            this._$entriesNode = $("<span>")
                .text("(" + this.entries + ")");
            this.$node = $("<div>")
                .addClass("filter-tree-node")
                .append($("<p>" + this.name + " </p>")
                    .append(this._$entriesNode)
                    .addClass("filter-tree-node-name"))
                .click(this._onClickEvent.bind(this));
            this.parent = null;
            this.root = null;
        }
        
        FilterTree.prototype = {
            _onClickEvent: function _onClickEvent(evt) {
                evt.stopPropagation();
                this._onClick([]);
            },
            _onClick: function _onClick(path) {
                path.unshift(this);
                
                this.onClick(path);
                if (this.parent === null) {
                    this.$node.find("*").removeClass("filter-node-selected");
                    for (var i = 0; i < path.length; ++i) {
                        path[i].$node.addClass("filter-node-selected");
                    }
                } else {
                    this.parent._onClick(path);
                }
            },
            onClick: function onClick(path) {
                // A placeholder for any listener the user wants to put in.
            },
            setEntries: function setEntries(num) {
                var oEntries = this.entries;
                
                this.entries = num;
                
                this._$entriesNode.text("(" + this.entries + ")");
                
                if (this.parent !== null) {
                    this.parent.setEntries(this.parent.entries - oEntries +
                        num);
                }
            },
            addEntries: function addEntries(num) {
                this.setEntries(this.entries + num);
            },
            hide: function hide() {
                this.$node.addClass("hidden");
            },
            show: function show() {
                this.$node.removeClass("hidden");
            },
            addChild: function addChild(child) {
                if (!(child instanceof FilterTree)) {
                    child = new FilterTree(child);
                }
                
                if (!this.hasChild(child.name)) {
                    child.parent = this;
                    child.root = this.root || this;
                    this.children[child.name] = child;
                    this.$node.append(child.$node);
                }
                return this;
            },
            hasChild: function hasChild(name) {
                return !!(this.children[name]);
            },
            getChild: function getChild(name) {
                return this.children[name];
            },
            getChildAtPath: function getChildAtPath(path) {
                path = path.split("/");
                
                var child = this;
                var slug;
                while (path.length) {
                    slug = path.shift();
                    if (!slug.length) {
                        continue;
                    }
                    if (!child.hasChild(slug)) {
                        break;
                    }
                    
                    child = child.getChild(slug);
                }
                
                return child;
            }
        };
        
        return FilterTree;
        
    })();
    
    var API_PATH = "https://{{lang}}.khanacademy.org";
    var DEFAULT_COLOR = "#555555";
    
    var apiSlugs = {
        topic: "/api/v1/topic/{{topicSlug}}",
        videoData: "/api/v1/videos/{{videoSlug}}",
        clarifications: "/api/internal/discussions/{{type}}/{{id}}/clarifications"
    };
    
    var languages = [
        ["en", "English"],
        ["es", "Spanish"],
        ["pt", "Portugese"],
        ["fr", "French"],
        ["tr", "Turkish"],
        ["nb", "Norwegian Bokmål"],
        ["hi", "Hindi"],
        ["id", "Indonesian"],
        ["ms", "Malay"],
        ["cs", "Czech"],
        ["da", "Danish"],
        ["de", "German"],
        ["xh", "Xhosa"],
        ["it", "Italian"],
        ["nl", "Dutch"],
        ["pl", "Polish"],
        ["el", "Greek"],
        ["bg", "Bulgarian"],
        ["mn", "Mongolian"],
        ["ru", "Russian"],
        ["sr", "Serbian"],
        ["uk", "Ukranian"],
        ["hy", "Armenian"],
        ["he", "Hebrew"],
        ["ur", "Urdu"],
        ["ar", "Arabic"],
        ["fa", "Persian (Farsi)"],
        ["bn", "Bengali"],
        ["te", "Telugu"],
        ["th", "Thai"],
        ["zh-hans", "Simplified Chinese"],
        ["ja", "Japanese"]
    ];
    // (Joshua): I couldn't find any public call to the KA API that could get
    //  all of the top level slugs in a reasonable amount of time so I just
    //  hardcoded them here. The top-level slugs are unlikely to change very
    //  much so this should be an okay thing to do.
    var topicSlugs = ["math", "science", "economics-finance-domain",
        "humanities", "computing", "test-prep", "partner-content",
        "talks-and-interviews", "coach-res", "college-admissions"];
    var topicSlugData = {
        "math": {
            title: "Math",
            color: "#1C758A",
            $el: null,
            tree: new FilterTree("math"),
            activeRequests: 0
        },
        "science": {
            title: "Science",
            color: "#94424F",
            $el: null,
            tree: new FilterTree("science"),
            activeRequests: 0
        },
        "economics-finance-domain": {
            title: "Economics and Finance",
            color: "#B77033",
            $el: null,
            tree: new FilterTree("economics-finance-domain"),
            activeRequests: 0
        },
        "humanities": {
            title: "Arts and Humanities",
            color: "#AD3434",
            $el: null,
            tree: new FilterTree("humanities"),
            activeRequests: 0
        },
        "computing": {
            title: "Computing",
            color: "#437A39",
            $el: null,
            tree: new FilterTree("computing"),
            activeRequests: 0
        },
        "test-prep": {
            title: "Test Prep",
            color: "#644172",
            $el: null,
            tree: new FilterTree("test-prep"),
            activeRequests: 0
        },
        "partner-content": {
            title: "Partner Content",
            color: "#218270",
            $el: null,
            tree: new FilterTree("partner-content"),
            activeRequests: 0
        },
        "college-admissions": {
            title: "College Admissions",
            color: DEFAULT_COLOR,
            $el: null,
            tree: new FilterTree("college-admissions"),
            activeRequests: 0
        },
        "talks-and-interviews": {
            title: "Talks and Interviews",
            color: DEFAULT_COLOR,
            $el: null,
            tree: new FilterTree("talks-and-interviews"),
            activeRequests: 0
        },
        "coach-res": {
            title: "Coach Resources",
            color: DEFAULT_COLOR,
            $el: null,
            tree: new FilterTree("coach-res"),
            activeRequests: 0
        }
    };
    
    var util = {
        formatString: function formatString(str, data) {
            return str.replace(/\{\{(.+?)\}\}/g, function(match, p1) {
                return data[p1];
            });
        },
        urlParamsToJSON: function urlParamsToJSON() {
            var json = {};
            
            var params = (window.location.href.split("?")[1] || "").split("&");
            
            for (var i = 0; i < params.length; ++i) {
                var prop = params[i].split("=");
                json[prop[0]] = prop[1];
            }
            
            return json;
        },
        jsonToUrlParams: function jsonToUrlParams(json) {
            return Object.keys(json).map(function(key) {
                return key + "=" + json[key];
            }).join("&");
        }
    };
    
    var cache = {};
    
    var $clarifsHeader;
    var $numClarifs;
    var $clarifsOutput;
    var $filtersContainer;
    var $filterTree;
    var $loaderPending;
    var $failedNum;
    var $articlesToggle;
    var $videosToggle;
    
    var filterPath = "/";
    var activeSlug = "";
    var numFailed = 0;
    var options = util.urlParamsToJSON();
    
    function addFailedRequest() {
        numFailed += 1;
        $failedNum.text(numFailed);
    }
    
    function addActiveRequests(amount, slug) {
        topicSlugData[slug].activeRequests += amount;
        $loaderPending.text(topicSlugData[slug].activeRequests);
    }
    
    function loadContentClarifs(content, cb, baseSlug, topicUrl, id) {
        addActiveRequests(1, baseSlug);
        
        $.getJSON({
            url: util.formatString(API_PATH + apiSlugs.clarifications, {
                type: (content.kind === "Article") ? "article" : "youtubevideo",
                id: id,
                lang: options.lang
            }),
            data: {
                casing: "camel",
                lang: options.lang
            },
            dataType: "jsonp"
        }).done(function(data, status) {
            addActiveRequests(-1, baseSlug);
            
            if (status === "success") {
                feedback = (data || {feedback: []}).feedback;
                
                var kind = (content.kind || "unknown").toLowerCase();
                for (var i = 0; i < feedback.length; ++i) {
                    feedback[i].contentKind = kind;
                    feedback[i].topicUrl = topicUrl;
                }
                
                cb(feedback, topicUrl, baseSlug, true);
            } else {
                addFailedRequest();
                cb([], "", "", false);
            }
        });
    }
    
    function loadVideoClarifs(video, cb, baseSlug, topicUrl) {
        addActiveRequests(1, baseSlug);
        $.getJSON({
            url: util.formatString(API_PATH + apiSlugs.videoData, {
                lang: options.lang,
                videoSlug: video.id
            }),
            data: {
                casing: "camel",
                lang: options.lang
            },
            dataType: "jsonp"
        }).done(function(data, status) {
            addActiveRequests(-1, baseSlug);
            if (status === "success") {
                loadContentClarifs(video, cb, baseSlug, topicUrl, data
                    .youtubeId);
            } else {
                addFailedRequest();
            }
        });
    }
    
    function addTopicToTree(topic, baseSlug) {
        if (typeof topic.relativeUrl === "string") {
            var path = topic.relativeUrl.slice(1).split("/");
            var tree = topicSlugData[baseSlug].tree;
            // Get rid of the first (always empty) slug
            var slug = path.shift();
            while (path.length > 0) {
                slug = path.shift();
                if (!tree.hasChild(slug)) {
                    tree.addChild(slug);
                }
                tree = tree.getChild(slug);
            }
        }
    }
    
    function loadTopicClarifs(topic, cb, baseSlug) {
        addTopicToTree(topic, baseSlug);
        
        for (var i = 0; i < topic.children.length; ++i) {
            switch (topic.children[i].kind) {
                case "Topic":
                    loadClarifs(util.formatString(API_PATH + apiSlugs.topic, {
                            topicSlug: topic.children[i].nodeSlug,
                            lang: options.lang
                        }), cb, baseSlug);
                    break;
                case "Video":
                    loadVideoClarifs(topic.children[i], cb, baseSlug, topic
                        .relativeUrl);
                    break;
                case "Article":
                    loadContentClarifs(topic.children[i], cb, baseSlug, topic
                        .relativeUrl, topic.children[i].internalId);
            }
        }
    }
    
    function loadClarifs(url, cb, baseSlug) {
        addActiveRequests(1, baseSlug);
        $.getJSON({
            url: url,
            data: {
                lang: "en",
                casing: "camel"
            },
            dataType: "jsonp"
        }).done(function(data, status) {
            addActiveRequests(-1, baseSlug);
            
            if (status === "success") {
                if (typeof baseSlug !== "string") {
                    baseSlug = data.nodeSlug;
                }
                
                switch (data.kind) {
                    case "Topic":
                        loadTopicClarifs(data, cb, baseSlug);
                        break;
                    case "Video":
                        loadVideoClarifs(data, cb, baseSlug);
                        break;
                    case "Article":
                        loadContentClarifs(data, cb, baseSlug, data.internalId);
                }
            } else {
                addFailedRequest();
                cb([], "", "", false);
            }
        });
    }
    
    function createClarifTags(clarif) {
        return $("<div>")
            .addClass("clarif-tag-row")
            .append($("<span>")
                .text(clarif.contentKind)
                .addClass("clarif-tag-badge")
                .addClass("clarif-tag-" + (clarif.contentKind)));
    }
    
    function createClarifEl(clarif) {
        return $("<div>")
            .addClass("clarif-holder")
            .append($("<p>" + clarif.content + "</p>")
                .addClass("clarif-content"))
            .append($("<p>Clarification on </p>")
                .append($("<a href='" + util.formatString(API_PATH, {
                    lang: options.lang
                }) + clarif.focusUrl + "'>" + clarif.focusUrl + "</a>")
                    .attr("target", "_blank"))
                    .addClass("clarif-link-line"))
            .append(createClarifTags(clarif));
    }
    
    function showFilterTree(slug) {
        if (!topicSlugData[slug].tree.$node.parent().length) {
            $filterTree.append(topicSlugData[slug].tree.$node);
        }
        
        for (var i = 0; i < topicSlugs.length; ++i) {
            topicSlugData[topicSlugs[i]].tree.hide();
        }
        topicSlugData[slug].tree.show();
    }
    
    function showClarifs(slug, filter) {
        if (typeof filter !== "function") {
            filter = function() {return true;};
        }
        $clarifsOutput.html("");
        var numClarifs = 0;
        // If we don't have the data cached and we haven't requested it yet.
        if (!cache[slug] && topicSlugData[slug].activeRequests === 0) {
            cache[slug] = [];
            loadClarifs(util.formatString(API_PATH + apiSlugs.topic, {
                topicSlug: slug,
                lang: options.lang
            }, slug), function(clarifs, topicUrl) {
                for (var i = 0; i < clarifs.length; ++i) {
                    if (filter(clarifs[i])) {
                        ++numClarifs;
                        $clarifsOutput.append(createClarifEl(clarifs[i]));
                    }
                }
                
                cache[slug].push.apply(cache[slug], clarifs);
                
                if (activeSlug === slug) {
                    $clarifsHeader.text("Clarifications in " +
                        topicSlugData[slug].title + " ");
                    $numClarifs.text("(Showing " + numClarifs + " of " +
                        cache[slug].length + ")");
                }
                
                topicSlugData[slug].tree.getChildAtPath(topicUrl
                    .replace(/^\/.+?\//, "")).addEntries(clarifs.length);
            }, slug);
        } else {
            for (var i = 0; i < cache[slug].length; ++i) {
                if (filter(cache[slug][i])) {
                    ++numClarifs;
                    $clarifsOutput.append(createClarifEl(cache[slug][i]));
                }
            }
            if (activeSlug === slug) {
                $clarifsHeader.text("Clarifications in " +
                    topicSlugData[slug].title + " ");
                $numClarifs.text("(Showing " + numClarifs + " of " +
                    cache[slug].length + ")");
            }
        }
        
        showFilterTree(slug);
    }
    
    function filterEntries(clarif) {
        return (
                    (
                        (clarif.contentKind === "article" && $articlesToggle
                            .is(":checked")) ||
                        (clarif.contentKind === "video" && $videosToggle
                            .is(":checked"))
                    ) &&
                    clarif.topicUrl.indexOf(filterPath) === 0
                );
    }
    
    function switchTopic(slug) {
        for (var i = 0; i < topicSlugs.length; ++i) {
            topicSlugData[topicSlugs[i]].$el.removeClass("selected");
            topicSlugData[topicSlugs[i]].tree.$node.addClass("hidden");
        }
        filterPath = "/" + slug;
        activeSlug = slug;
        topicSlugData[slug].$el.addClass("selected");
        $filtersContainer.removeClass("hidden");
        $clarifsHeader.text("Clarifications in " +
            topicSlugData[slug].title);
        topicSlugData[slug].tree.$node.removeClass("hidden");
        if (!topicSlugData[slug].tree.$node.parent().length) {
            $filterTree.append(topicSlugData[slug].tree.$node);
        }
        showClarifs(slug, filterEntries);
    }
    
    function createSlugEl(slug, data) {
        return $("<div>")
            .addClass("topic-slug-option")
            .css({
                "background-color": data.color
            })
            .click(switchTopic.bind(switchTopic, slug))
            .append($("<p>" + data.title + "</p>")
                .addClass("text-overflow-ellipsis"));
    }
    
    function changeLang(lang) {
        options.lang = lang;
        window.location.href = window.location.href.split("?")[0] + "?" +
            util.jsonToUrlParams(options);
    }
    
    function onTreeClick(path) {
        filterPath = "/" + path
            .map(function(el) {return el.name;}).join("/");
        showClarifs(this.name, filterEntries);
    }
    
    function initSlugSelector() {
        var $slugSelection = $(".topic-slug-selection");
        
        for (var i = 0; i < topicSlugs.length; ++i) {
            var data = topicSlugData[topicSlugs[i]];
            data.$el = createSlugEl(topicSlugs[i], data);
            data.tree.onClick = onTreeClick;
            $slugSelection.append(data.$el);
        }
    }
    
    function createLanguageOption(lang) {
        return $("<a>")
            .attr("href", "javascript: void(0);")
            .attr("title", lang[1])
            .text(lang[0])
            .click(function() {
                changeLang(lang[0]);
            })
            .addClass("language-selection-option");
    }
    
    function initLanguageSelector() {
        var $langSelect = $(".language-selection");
        
        for (var i = 0; i < languages.length; ++i) {
            $langSelect.append(createLanguageOption(languages[i]));
        }
    }
    
    $(document).ready(function() {
        initSlugSelector();
        initLanguageSelector();
        
        $clarifsHeader = $(".clarifs-header-main-content");
        $numClarifs = $(".num-clarifs-shown");
        $clarifsOutput = $(".output-results");
        $filtersContainer = $(".output-filters");
        $filterTree = $(".output-filters-tree");
        $loaderPending = $(".num-pending");
        $failedNum = $(".num-failed");
        $articlesToggle = $("#articles-toggle");
        $videosToggle = $("#videos-toggle");
        
        options.lang = ((typeof options.lang === "string" &&
            options.lang.length > 0) ? options.lang : "en")
            .replace(/[^a-z]/i, "").toLowerCase();
        
        $(".filter-controls-form :input").change(function() {
            showClarifs(activeSlug, filterEntries);
        });
    });
    
})();
