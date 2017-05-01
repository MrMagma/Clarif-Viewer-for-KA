import fb from "../../fb-wrapper.js";
import events from "../../events/events.js";
import trees from "./trees.js";

let topSlugMap = {};
fb.db.ref("/content_tree/slug_map").once("value", (snapshot) => {
    topSlugMap = snapshot.val();
});

export default function getTree(slug, cb) {
    // TODO: Set an in-progress status somewhere
    fb.db.ref(`/content_tree/children/${topSlugMap[slug]}`)
        .once("value", (snapshot) => {
            trees[slug] = snapshot.val();
            events.fire("tree-loaded", slug, trees[slug]);
            cb(trees[slug]);
        });
}
