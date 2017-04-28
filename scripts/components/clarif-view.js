import ClarifElement from "./clarif-element.js";
import events from "../events/events.js";
import EventEmitter from "../events/event-emitter.js";
import gData from "../data.js";
import page from "../page.js";

let data = {
    clarifs: [],
    shownClarifs: [],
    filters: {},
    sortedWith: null,
    sort: null,
    events: new EventEmitter()
};

let $shownClarifs = $(".js-clarifs-shown");
let $totalClarifs = $(".js-clarifs-total");

events.on("clarifs-added", clarifs => {
    data.clarifs.push.apply(data.clarifs,
        clarifs.map((clarif, i) => new ClarifElement(clarif, data.clarifs.length + i)));
    data.shownClarifs = data.clarifs.filter(filterClarifs).sort(sortClarifs);
    $shownClarifs.text(data.shownClarifs.length);
    $totalClarifs.text(data.clarifs.length);
    data.events.fire("change");
});

events.on("filter-changed", (filters = {}) => {
    for (let key in filters) {
        if (filters.hasOwnProperty(key)) {
            data.filters[key] = filters[key];
        }
    }
    data.shownClarifs = data.clarifs.filter(filterClarifs).sort(sortClarifs);
    $shownClarifs.text(data.shownClarifs.length);
    data.events.fire("change");
});

events.on("sort-changed", sort => {
    data.sort = gData.sorts[sort];
    if (data.sortedWith.key !== data.sort.key ||
        data.sortedWith.order !== data.sort.order) {
        data.shownClarifs = data.shownClarifs.sort(sortClarifs);
        data.events.fire("change");
        data.sortedWith = data.sort;
    }
});

events.on("tag-change", (evtData, tags) => {
    data.clarifs[evtData.id].setTags(tags);
});

class ClarifView {
    constructor(domSelector) {
        this.$domNode = $(domSelector);
        
        this.$domNode.click(this.handleAddTagClick.bind(this));
        data.events.on("change", this.updateDisplay.bind(this));
    }
    handleAddTagClick(evt) {
        if (evt.target.dataset.id != null) {
            let clarif = data.clarifs[evt.target.dataset.id];
            events.fire("show-tag-modal", {
                expandKey: clarif.expandKey,
                tags: clarif.tags,
                domainSlug: clarif.domainSlug,
                id: evt.target.dataset.id
            });
        }
    }
    handleClarifTagChange(tags, clarifIndex) {
        data.clarifs[clarifIndex].addTags(tags);
    }
    updateDisplay() {
        this.$domNode.html("");
        this.$domNode.append(data.shownClarifs.map(clarif => clarif.$domNode));
    }
    static init() {
        data.sort = gData.sorts[page.getParam("sort")];
        data.sortedWith = gData.sorts[page.getParam("sort")];
    }
}

function filterClarifs(clarif) {
    for (let key in data.filters) {
        if (data.filters.hasOwnProperty(key)) {
            if (!data.filters[key](clarif)) {
                return false;
            }
        }
    }
    
    return true;
}

function sortClarifs(clarifA, clarifB) {
    return (clarifA[data.sort.key] - clarifB[data.sort.key]) * data.sort.order;
}

export default ClarifView;
