import SelectGroup from "./select-group.js";
import DateRange from "./date-range.js";
import page from "../page.js";
import data from "../data.js";
import fb from "../fb-wrapper.js";
import events from "../events/events.js";
import util from "../utils.js";

class FilterPanel {
    constructor(domSelector) {
        this.$domNode = $(domSelector);
        
        this.filter = new SelectGroup(this.$domNode);
        
        fb.db.ref("/data/tags").on("value", (snapshot) => {
            this.setFilter(snapshot.val());
        });
        
        this.sort = new SelectGroup(this.$domNode);
        this.range = new DateRange(this.$domNode);
        
        this.sort.set([
            {
                selected: [parseInt(page.getParam("sort"))],
                label: "Sort results by",
                name: "sort-by",
                options: data.sorts.map((sort, i) => {
                    return {
                        text: sort.text,
                        value: i
                    };
                })
            }
        ]);
        
        this.filter.on("data-changed", this.handleFilterChange.bind(this));
        this.sort.on("data-changed", this.handleSortChange.bind(this));
        events.fire("filter-changed", {
            tags: this.filterClarif.bind(this)
        });
        
        this.handleSortChange();
    }
    setFilter(tags) {
        this.filter.set([
            {
                multiple: true,
                selections: parseInt(page.getParam("filter-tags"), 16)
                // We reverse so that when someone adds a tag they won't break
                //  the filter-tag URL param on URLs from before they added the
                //  new tag.
                    .toString(2).split("").reverse()
                    .map(val => !!parseInt(val)),
                label: "Show clarifications with these tags:",
                name: "tags",
                options: Object.keys(tags).map(key => {
                    return {
                        text: tags[key].name,
                        value: key
                    };
                })
            }
        ]);
        this.handleFilterChange();
    }
    filterClarif(clarif) {
        let tags = this.filter.getData("tags");
        
        for (let tag of clarif.tags) {
            if (tags.indexOf(tag) !== -1) {
                return true;
            }
        }
        
        return false;
    }
    handleFilterChange() {
        fb.db.ref("/data/tags").once("value").then((snapshot) => {
            let tags = Object.keys(snapshot.val());
            let tagSelection = this.filter.getData("tags");
            page.setParam("filter-tags", parseInt(tags.reverse()
                .map(tag => ((tagSelection.indexOf(tag) !== -1) + 0))
                    .join(""), 2)
                .toString(16));
            events.fire("filter-changed");
        });
    }
    handleSortChange() {
        let sort = this.sort.getData("sort-by")[0];
        page.setParam("sort", sort);
        events.fire("sort-changed", sort);
    }
}

export default FilterPanel;
