import AuthButton from "./components/auth-button.js";
import ClarifView from "./components/clarif-view.js";
import data from "./data.js";
import events from "./events/events.js";
import fb from "./fb-wrapper.js";
import FilterPanel from "./components/filter-panel.js";
import LanguageSelect from "./components/language-select.js";
import LoadButton from "./components/load-button.js";
import page from "./page.js";
import TagModal from "./components/tag-modal.js";
import TopicTree from "./components/topic-tree.js";
import util from "./utils.js";

function initParams(tags) {
    page.loadParams({
        lang: "en",
        sort: 0,
        "filter-tags": parseInt(Array.apply(null, Array(tags.length))
            .map(val => "1").join(""), 2).toString(16)
    });

    let sort = parseInt(page.getParam("sort"));

    if (!sort) {
        page.setParam("sort", 0);
    } else if (sort < 0) {
        page.setParam("sort", 0);
    } else if (sort > data.sorts.length - 1) {
        page.setParam("sort", data.sorts.length - 1);
    }
}

function onDataLoad(tags) {
    initParams(tags);
    // Call initiation functions for classes that rely on the page.loadParams having been called.
    ClarifView.init();

    $(document).ready(function() {
        new TagModal("tag-modal");
        new ClarifView(".js-clarif-view");
        new FilterPanel(".js-filter-sort");
        new TopicTree(".js-topic-tree");
        new LanguageSelect(".js-language-select-wrapper");
        new AuthButton(".js-auth-btn", {
            provider: "google",
            markup: {
                // <img class='cvka-auth-img' src='{{photoURL}}'></img>
                // No profile picture because I'm too lazy to style right now.
                auth: "<span class='cvka-auth-message'>Hello {{displayName}}, click here to log out</span>",
                noAuth: "<span class='cvka-auth-message'>Hello Guest, click here to log in.</span>"
            }
        });
        new LoadButton(".js-load-btn");
        
        let $failedRequests = $(".js-failed-requests");
        let $pendingRequests = $(".js-pending-requests");
        let $statusMessage = $(".js-status-message");
        
        events.on("status-changed", (status) => {
            $failedRequests.text(status.failedRequests);
            $pendingRequests.text(status.activeRequests);
            $statusMessage.text(status.message);
        });
    });
}

fb.db.ref("/data/tags").once("value").then((tags) => {
    onDataLoad(util.fbValToArray(tags.val()));
});
