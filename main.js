(function() {
    
    var FilterTree = (function() {
        
        function FilterTree(name) {
            this.name = name;
            this.children = {};
            this.$node = $("<div>")
                .addClass("filter-tree-node")
                .append($("<p>" + this.name + "</p>")
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
            }
        };
        
        return FilterTree;
        
    })();
    
    var API_PATH = "https://www.khanacademy.org/api/";
    var DEFAULT_COLOR = "#555555";
    
    var apiSlugs = {
        topic: "v1/topic/{{topicSlug}}",
        clarifications: "internal/discussions/{{type}}/{{id}}/clarifications"
    };
    
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
            tree: new FilterTree("math")
        },
        "science": {
            title: "Science",
            color: "#94424F",
            $el: null,
            tree: new FilterTree("science")
        },
        "economics-finance-domain": {
            title: "Economics and Finance",
            color: "#B77033",
            $el: null,
            tree: new FilterTree("economics-finance-domain")
        },
        "humanities": {
            title: "Arts and Humanities",
            color: "#AD3434",
            $el: null,
            tree: new FilterTree("humanities")
        },
        "computing": {
            title: "Computing",
            color: "#437A39",
            $el: null,
            tree: new FilterTree("computing")
        },
        "test-prep": {
            title: "Test Prep",
            color: "#644172",
            $el: null,
            tree: new FilterTree("test-prep")
        },
        "partner-content": {
            title: "Partner Content",
            color: "#218270",
            $el: null,
            tree: new FilterTree("partner-content")
        },
        "college-admissions": {
            title: "College Admissions",
            color: DEFAULT_COLOR,
            $el: null,
            tree: new FilterTree("college-admissions")
        },
        "talks-and-interviews": {
            title: "Talks and Interviews",
            color: DEFAULT_COLOR,
            $el: null,
            tree: new FilterTree("talks-and-interviews")
        },
        "coach-res": {
            title: "Coach Resources",
            color: DEFAULT_COLOR,
            $el: null,
            tree: new FilterTree("coach-res")
        }
    };
    
    var util = {
        formatString: function formatString(str, data) {
            return str.replace(/\{\{(.+?)\}\}/g, function(match, p1) {
                return data[p1];
            });
        }
    };
    
    var cache = {};
    
    var $clarifsHeader;
    var $numClarifs;
    var $clarifsOutput;
    var $filtersContainer;
    var $filterTree;
    var $loader;
    
    var filterPath = "/";
    
    function loadContentClarifs(content, cb) {
        $.getJSON({
            url: util.formatString(API_PATH + apiSlugs.clarifications, {
                type: (content.kind === "Article") ? "article" : "youtubevideo",
                id: content.internal_id
            }),
            dataType: "jsonp"
        }).done(function(data, status) {
            if (status === "success") {
                cb((data || {feedback: []}).feedback, true);
            } else {
                cb([], false);
            }
        });
    }
    
    function loadTopicClarifs(topic, cb, baseSlug) {
        var url = "";
        
        for (var i = 0; i < topic.children.length; ++i) {
            switch (topic.children[i].kind) {
                case "Topic":
                    loadClarifs(util.formatString(API_PATH + apiSlugs.topic, {
                            topicSlug: topic.children[i].node_slug
                        }), cb, baseSlug);
                    break;
                case "Article":
                case "Video":
                    loadContentClarifs(topic.children[i], cb);
            }
        }
        
        var path = topic.relative_url.slice(1).split("/");
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
    
    function loadClarifs(url, cb, baseSlug) {
        $.getJSON({
            url: url,
            dataType: "jsonp"
        }).done(function(data, status) {
            if (status === "success") {
                if (typeof baseSlug !== "string") {
                    baseSlug = data.node_slug;
                }
                switch (data.kind) {
                    case "Topic":
                        loadTopicClarifs(data, cb, baseSlug);
                        break;
                    case "Video":
                    case "Article":
                        loadContentClarifs(data, cb);
                }
            } else {
                cb([], false);
            }
        });
    }
    
    function createClarifEl(clarif) {
        return $("<div>")
            .addClass("clarif-holder")
            .append($("<p>" + clarif.content + "</p>")
                .addClass("clarif-content"))
            .append($("<p>Clarification on </p>")
                .append($("<a href='https://khanacademy.org/" +
                    clarif.focusUrl + "'>" + clarif.focusUrl + "</a>"))
                .addClass("clarif-link-line"));
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
        if (!cache[slug]) {
            cache[slug] = [];
            $loader.removeClass("hidden");
            loadClarifs(util.formatString(API_PATH + apiSlugs.topic, {
                topicSlug: slug
            }, slug), function(clarifs) {
                for (var i = 0; i < clarifs.length; ++i) {
                    if (filter(clarifs[i])) {
                        $clarifsOutput.append(createClarifEl(clarifs[i]));
                    }
                }
                numClarifs += clarifs.length;
                cache[slug].push.apply(cache[slug], clarifs);
                $loader.addClass("hidden");
                $clarifsHeader.text("Clarifications in " +
                    topicSlugData[slug].title + " (" + numClarifs + ")");
            });
        } else {
            for (var i = 0; i < cache[slug].length; ++i) {
                if (filter(cache[slug][i])) {
                    $clarifsOutput.append(createClarifEl(cache[slug][i]));
                }
            }
            $clarifsHeader.text("Clarifications in " +
                topicSlugData[slug].title + " (" + cache[slug].length + ")");
        }
        showFilterTree(slug);
    }
    
    function filterEntries(clarif) {
        return (clarif.focusUrl.indexOf(filterPath) === 0);
    }
    
    function switchTopic(slug) {
        for (var i = 0; i < topicSlugs.length; ++i) {
            topicSlugData[topicSlugs[i]].$el.removeClass("selected");
        }
        filterPath = "/";
        topicSlugData[slug].$el.addClass("selected");
        $filtersContainer.removeClass("hidden");
        $clarifsHeader.text("Clarifications in " +
            topicSlugData[slug].title);
        $filterTree.html("");
        $filterTree.append(topicSlugData[slug].tree);
        showClarifs(slug, filterEntries);
    }
    
    function createSlugEl(slug, data) {
        return $("<div>")
            .addClass("topic-slug-option")
            .css({
                "background-color": data.color
            })
            .click(switchTopic.bind(switchTopic, slug))
            .append($("<p>" + data.title + "</p>"));
    }
    
    function onTreeClick(path) {
        filterPath = "/" + path
            .map(function(el) {return el.name;}).join("/");
        console.log(filterPath);
        showClarifs(this.name, filterEntries);
    }
    
    $(document).ready(function() {
        var slugSelection = $(".topic-slug-selection");
        for (var i = 0; i < topicSlugs.length; ++i) {
            var data = topicSlugData[topicSlugs[i]];
            data.$el = createSlugEl(topicSlugs[i], data);
            data.tree.onClick = onTreeClick;
            slugSelection.append(data.$el);
        }
        $clarifsHeader = $(".clarifs-header");
        $numClarifs = $(".num-clarifs");
        $clarifsOutput = $(".output-results");
        $filtersContainer = $(".output-filters");
        $filterTree = $(".output-filters-tree");
        $loader = $(".loader");
    });
    
})();
