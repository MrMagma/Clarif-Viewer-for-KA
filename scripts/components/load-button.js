import EventEmitter from "../events/event-emitter.js";
import events from "../events/events.js";
import clarifs from "../api/clarifs.js";
import page from "../page.js";

class LoadButton extends EventEmitter {
    constructor(selector) {
        super();
        this.$btn = $(selector).click(this.handleClick.bind(this));
        events.on("slug-changed", this.handleSlugChange.bind(this));
        
        if (!page.getParam("path")) {
            this.$btn.attr("disabled", "disabled");
        }
    }
    handleSlugChange() {
        this.$btn.removeAttr("disabled")
    }
    handleClick() {
        this.$btn.attr("disabled", "disabled");
        clarifs.load(page.getParam("path"));
    }
}

export default LoadButton;
