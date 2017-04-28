import EventEmitter from "../events/event-emitter.js";

class SlugTree extends EventEmitter {
    constructor(cfg = {}) {
        let {title, slug = title, path = slug, className = "", style = {},
            parent = null, children = []} = cfg;
        super();
        this.parent = parent;
        this.title = title;
        this.slug = slug;
        this.path = path;
        this.counter = 0;
        this.children = children.map(child => new SlugTree(child));
        this.$domNode = $("<div>")
            .addClass("cvka-slug")
            .click(this.handleClick.bind(this));
        this.$counter = $("<span>")
            .addClass("cvka-counter")
            .text(`(${this.counter})`)
            .css("display", "none");
        this.$nameEl = $("<p>")
            .text(title)
            .addClass("cvka-slug-title")
            .append(this.$counter);
        
        this.$domNode.addClass(className);
        this.$domNode.css(style);
        this.$domNode.append(this.$nameEl);
        this.init();
    }
    init(cfg = {}) {
        this.on("child-selected", this.handleChildSelect.bind(this));
        this.$domNode.append(this.children.map(child => child.$domNode));
    }
    setTitle(title) {
        this.title = title;
        this.$nameEl.text(title);
    }
    addChild(child) {
        child.parent = this;
        this.children.push(child);
        this.$domNode.append(child.$domNode);
    }
    setActive(active) {
        if (active) {
            this.$domNode.addClass("active");
        } else {
            this.$domNode.removeClass("active");
        }
    }
    getChildBySlug(slug) {
        for (let child of this.children) {
            if (child.slug === slug) {
                return child;
            }
        }
        return null;
    }
    getChildAtPath(path) {
        if (typeof path === "string") {
            path = path.split("/");
        }
        var top = path.shift();
        var child = this.getChildBySlug(top);
        
        if (child !== null && path.length) {
            return child.getChildAtPath(path)
        } else {
            return child;
        }
    }
    handleClick(evt) {
        evt.stopPropagation();
        this.handleChildSelect([]);
    }
    handleChildSelect(path) {
        if (this.parent != null) {
            path.unshift(this.slug);
            this.parent.fire("child-selected", path);
        } else {
            this.resetChildren();
            this.activatePath(JSON.parse(JSON.stringify(path)));
        }
    }
    resetChildren() {
        for (let child of this.children) {
            child.setActive(false);
            child.resetChildren();
        }
    }
    activatePath(path) {
        let child = this;
        child.setActive(true);
        do {
            child = child.getChildBySlug(path.shift());
            child.setActive(true);
        } while (path.length > 0);
    }
    setActive(active) {
        this.$domNode.removeClass("active");
        if (active) {
            this.$domNode.addClass("active");
        }
    }
    incrementCounter() {
        this.$counter.text(`(${++this.counter})`).css("display", "inline");
    }
}

export default SlugTree;
