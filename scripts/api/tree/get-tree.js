import fb from "../../fb-wrapper.js";
import events from "../../events/events.js";
import trees from "./trees.js";
import page from "../../page.js";
import slugData from "./slug-data.js";

export default function getTree(slug, cb) {
    // TODO: Set an in-progress status somewhere
    fb.db.ref(`/content_trees/${page.getParam("lang")}/children/${slugData[page.getParam("lang")][slug].child_index}`)
        .once("value")
        .then((snapshot) => {
            trees[slug] = snapshot.val();
            events.fire("tree-loaded", slug, trees[slug]);
            cb(trees[slug]);
        });
}
