import EventEmitter from "../events/event-emitter.js";

class SlugTree extends EventEmitter {
    constructor(cfg = {}) {
        let {title, slug, path = "/", className = "", style = {},
            parent = null, children = [], childrenVisible = true} = cfg;
        super();
        this.parent = parent;
        this.title = title;
        this.slug = slug;
        this.path = path;
        this.counter = 0;
        this.children = children.map(child => new SlugTree(child));
        this.childrenVisible = childrenVisible;

        this.$domNode = $("<div>")
            .addClass("cvka-slug")
            .click(this.handleClick.bind(this));
        this.$counter = $("<span>")
            .addClass("cvka-counter")
            .text(`(${this.counter})`)
            .css("display", "none");
        this.$toggle = $("<i>")
            .addClass("material-icons")
            .text(this.childrenVisible ? "keyboard_arrow_down" : "keyboard_arrow_right")
            .click((evt) => {
                evt.stopPropagation();
                this.toggleChildrenVisibility(this)
            })
            .css("display", this.children.length > 0 ? "" : "none");
        this.$nameEl = $("<p>")
            .text(title)
            .addClass("cvka-slug-title")
            .append(this.$counter)
            .prepend(this.$toggle);
        this.$childContainer = $("<div>");
        
        this.$domNode.addClass(className);
        this.$domNode.css(style);
        this.$domNode.append(this.$nameEl);
        this.$domNode.append(this.$childContainer);
        this.init();
    }
    init(cfg = {}) {
        this.on("child-selected", this.handleChildSelect.bind(this));
        this.$childContainer.append(this.children.map(child => child.$domNode));
    }
    clear() {
        for (let child of this.children) {
            child.destroy();
        }
        this.children = [];
        this.$toggle.css("display", this.children.length > 0 ? "" : "none");
    }
    destroy() {
        this.$domNode.remove();
    }
    setTitle(title) {
        this.title = title;
        this.$nameEl.text(title);
    }
    addChild(child) {
        child.parent = this;
        this.children.push(child);
        this.$childContainer.append(child.$domNode);
        this.$toggle.css("display", this.children.length > 0 ? "" : "none");
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
        path = JSON.parse(JSON.stringify(path));
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
        this.handleChildSelect(this.path.split("/").slice(1));
    }
    handleChildSelect(path) {
        if (this.parent != null) {
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
        while (path.length > 0) {
            child = child.getChildBySlug(path.shift());
            child.setActive(true);
        }
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
    toggleChildrenVisibility() {
        if (this.childrenVisible) {
            this.childrenVisible = false;
            this.$toggle.text("keyboard_arrow_right");
            this.$childContainer.hide();
        } else {
            this.childrenVisible = true;
            this.$toggle.text("keyboard_arrow_down");
            this.$childContainer.show();
        }
    }
}

export default SlugTree;
