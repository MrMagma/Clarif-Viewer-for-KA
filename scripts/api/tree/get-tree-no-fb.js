import events from "../../events/events.js";
import trees from "./trees.js";
import data from "../../data.js";
import utils from "../../utils.js";
import page from "../../page.js";

let {formatString: format} = utils;

function getRealVideoSlug(slug, cb) {
    $.getJSON({
        url: format(data.API_PATH + data.apiSlugs.video, {
            lang: page.getParam("lang"),
            videoSlug: slug
        }),
        data: {
            lang: page.getParam("lang"),
            _: (new Date()).getTime()
        }
    }).done((video) => {
        cb(video.youtube_id);
    });
}

function getTopic(slug, cb) {
    let activeRequests = 0;
    
    $.getJSON({
        url: format(data.API_PATH + data.apiSlugs.topic, {
            lang: page.getParam("lang"),
            topicSlug: slug
        }),
        data: {
            lang: page.getParam("lang"),
            _: (new Date()).getTime()
        }
    }).done((topic) => {
        let tree = {
            slug: topic.node_slug,
            relative_url: topic.relative_url,
            title: topic.title,
            children: [],
            video_slug_map: {}
        };
        
        let hasTopicChildren = false;
        
        for (let child of topic.children) {
            if (child.kind === "Topic") {
                hasTopicChildren = true;
                activeRequests += 1;
                getTopic(child.node_slug, (topic) => {
                    tree.children.push(topic);
                    activeRequests -= 1;
                });
            } else if (child.kind === "Video") {
                activeRequests += 1;
                (function(child) {
                    getRealVideoSlug(child.id, (video_slug) => {
                        tree.video_slug_map[child.id] = video_slug;
                        activeRequests -= 1;
                    });
                })(child);
            }
        }
        
        if (!hasTopicChildren) {
            delete tree.children;
        }
        
        let interval;
        interval = setInterval(() => {
            if (activeRequests === 0) {
                clearInterval(interval);
                cb(tree);
            }
        }, 1000);
    });
}

export default function getTree(slug, cb) {
    // TODO: Set in progress thing
    getTopic(slug, (tree) => {
        trees[slug] = tree;
        events.fire("tree-loaded", slug, trees[slug]);
        cb(trees[slug]);
    });
}
