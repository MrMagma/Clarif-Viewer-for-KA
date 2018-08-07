import fb from "../../fb-wrapper.js";
import events from "../../events/events.js";
import page from "../../page.js";

let slugData = {};

function updateSlugMap() {
    fb.db.ref(`/content_trees/${page.getParam("lang")}/slug_data`)
        .once("value")
        .then((snapshot) => {
            slugData[page.getParam("lang")] = snapshot.val();
            events.fire("slug-data-loaded", snapshot.val());
        });
}

events.on("lang-changed", updateSlugMap);

export default slugData;
