import SlugTree from "./slug-tree.js";
import clarifs from "../api/clarifs.js";
import events from "../events/events.js";

const DEFAULT_COLOR = "#555555";

let $clarifStatus = $(".js-clarifs-status")
    .css("display", "none");
let $filterTopic = $(".js-filter-topic");

let slugData = [
    {
        title: "Math",
        color: "#1C758A",
        slug: "math"
    },
    {
        title: "Science",
        color: "#94424F",
        slug: "science"
    },
    {
        title: "Economics and Finance",
        color: "#B77033",
        slug: "economics-finance-domain"
    },
    {
        title: "Arts and Humanities",
        color: "#AD3434",
        slug: "humanities"
    },
    {
        title: "Computing",
        color: "#437A39",
        slug: "computing"
    },
    {
        title: "Test Prep",
        color: "#644172",
        slug: "test-prep"
    },
    {
        title: "Partner Content",
        color: "#218270",
        slug: "partner-content"
    },
    {
        title: "College Admissions",
        color: DEFAULT_COLOR,
        slug: "college-admissions"
    },
    {
        title: "Talks and Interviews",
        color: DEFAULT_COLOR,
        slug: "talks-and-interviews"
    },
    {
        title: "Coach Resources",
        color: DEFAULT_COLOR,
        slug: "coach-res"
    }
];

let data = {
    slugTrees: {},
    init() {
        for (let slug of slugData) {
            this.slugTrees[slug.slug] = new SlugTree({
                className: "cvka-top-level-slug white-text",
                style: {
                    backgroundColor: slug.color
                },
                ...slug
            });
        }
    }
};

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
    applyContentTree(data.slugTrees[slug], tree);
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
        for (let slug in data.slugTrees) {
            if (data.slugTrees.hasOwnProperty(slug)) {
                this.addChild(data.slugTrees[slug]);
            }
        }
        
        this.on("child-selected", this.onChildSelect.bind(this));
        events.on("clarifs-added", this.updateCounters.bind(this));
    }
    onChildSelect(path) {
        selectedPath = path;
        $filterTopic.text(this.getChildBySlug(path[0]).title);
        $clarifStatus.css("display", "block");
        events.fire("filter-changed");
        if (!clarifs.loadStarted(path[0])) {
            clarifs.load(path[0]);
        }
    }
    updateCounters(clarifs) {
        for (let {parentSlug: path} of clarifs) {
            path = path.slice(1, path.length).split("/");
            let child = this;
            do {
                child.incrementCounter();
                child = child.getChildBySlug(path.shift());
            } while(path.length > 0);
        }
    }
}

data.init();

export default TopicTree;
