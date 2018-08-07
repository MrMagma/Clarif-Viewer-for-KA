import SlugTree from "./slug-tree.js";
// import clarifs from "../api/clarifs.js";
import events from "../events/events.js";
import page from "../page.js";
// import {slugSort} from "../data.js"
import getTree from "../api/tree/get-tree.js";
import data from "../data.js";
let {slugSort} = data;

let $clarifStatus = $(".js-clarifs-status");
let $filterTopic = $(".js-filter-topic");

let slugTrees = {};

events.on("slug-data-loaded", (slugData) => {
    slugTrees[page.getParam("lang")] = [];
    
    for (let key in slugData) {
        if (slugData.hasOwnProperty(key)) {
            let slug = slugData[key];
            slugTrees[page.getParam("lang")].push(new SlugTree({
                className: "cvka-top-level-slug white-text",
                style: {
                    backgroundColor: slug.color
                },
                slug: key,
                path: "/" + data.topicSlugs[slug.child_index],
                title: slug.title,
                childrenVisible: false
            }));
        }
    }
    
    slugTrees[page.getParam("lang")] =
        slugTrees[page.getParam("lang")].sort((a, b) =>
            slugSort[a.slug] - slugSort[b.slug]);
});

function applyContentTree(slugTree, contentTree) {
    for (let child of contentTree.children) {
        let childSlugTree = new SlugTree({
            title: child.title,
            slug: child.slug,
            path: child.relative_url,
            className: "cvka-subtopic-slug white-text"
        });
        if (child.children != null) {
            applyContentTree(childSlugTree, child);
        }
        slugTree.addChild(childSlugTree);
    }
}

events.on("tree-loaded", (slug, tree) => {
    let langTrees = slugTrees[page.getParam("lang")];
    for (var i = 0; i < langTrees.length; ++i) {
        if (langTrees[i].slug === slug) break;
    }
    slugTrees[page.getParam("lang")][i].toggleChildrenVisibility();
    applyContentTree(slugTrees[page.getParam("lang")][i], tree);
});

let selectedPath = [];

events.fire("filter-changed", {
    path: (clarif) => {
        let clarifPath = clarif.path;
        
        if (clarifPath.length < selectedPath.length) {
            return false;
        }
        
        for (let i = 0, len = selectedPath.length; i < len; ++i) {
            if (clarifPath[i] !== selectedPath[i]) {
                return false;
            }
        }
        
        return true;
    }
});

class TopicTree extends SlugTree {
    constructor(domSelector) {
        super();
        this.$domNode = $(domSelector);
        
        this.$nameEl.css("display", "none");
        
        this.$domNode.append(this.$childContainer);
        this.on("child-selected", this.onChildSelect.bind(this));
        events.on("clarifs-added", this.updateCounters.bind(this));
        events.on("slug-data-loaded", this.updateTree.bind(this));
    }
    onChildSelect(path) {
        selectedPath = path;
        $filterTopic.text(this.getChildAtPath(path).title);
        events.fire("filter-changed");
        events.fire("slug-changed");
        page.setParam("path", path.join("/"));
        if (path.length === 1) {
            getTree(path[0], () => {/* TODO (Joshua): Do something */});
        }
    }
    updateCounters(clarifs) {
        for (let {parentSlug: path} of clarifs) {
            path = path.slice(1, path.length).split("/");
            this.incrementCounter();
            let child = this;
            do {
                child = child.getChildBySlug(path.shift());
                child.incrementCounter();
            } while(path.length > 0);
        }
    }
    updateTree() {
        this.clear();
        
        for (let slugTree of slugTrees[page.getParam("lang")]) {
            this.addChild(slugTree);
        }
    }
}

export default TopicTree;
