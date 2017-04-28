import data from "../data.js";
import fb from "../fb-wrapper.js";
import utils from "../utils.js";
import page from "../page.js";
import events from "../events/events.js";
import EventEmitter from "../events/event-emitter.js";
import getTree from "./tree/get-tree.js";
import trees from "./tree/trees.js";

let {formatString, fbValToArray} = utils,
    {db} = data;

let kindMap = {};
fb.db.ref("/data/tags").once("value", (snapshot) => {
    let keys = Object.keys(snapshot.val());
    kindMap.video = keys[0];
    kindMap.article = keys[1];
});

let requests = {
    active: 0,
    failed: 0
};

function sendReq({url, cb, fail = () => {}, end = () => {}}) {
    if (requests.active > data.MAX_ACTIVE_REQUESTS) {
        setTimeout(sendReq.bind(sendReq, {
            url: url,
            cb: cb,
            fail: fail,
            end: end
        }), 20);
    } else {
        requests.active++;
        $.getJSON({
            url: url,
            data: {
                casing: "camel",
                lang: page.getParam("lang"),
                _: (new Date()).getTime()
            }
        }).done((...args) => {
            cb.apply(cb, args);
        }).fail((...args) => {
            fail.apply(fail, args);
            requests.failed++;
        }).always((...args) => {
            end.apply(end, args);
            requests.active--;
        });
    }
}

function mapClarifs(contentKind, lang, tagList, relUrl, clarif) {
    return {
        contentKind: contentKind,
        content: clarif.content,
        lang: lang,
        epoch: (new Date(clarif.date)).getTime(),
        votes: clarif.sumVotesIncremented,
        expandKey: clarif.expandKey,
        url: clarif.focusUrl,
        flags: clarif.flags.length,
        parentSlug: relUrl,
        domainSlug: relUrl.replace(/\/(.+?)\/.+/, "$1"),
        path: clarif.permalink,
        tags: [kindMap[contentKind], ...(tagList[clarif.expandKey] || [])]
    };
}

class Loader extends EventEmitter {
    constructor(lang) {
        super();
        
        this.lang = lang;
        
        this.loadStarted = {};
        
        this.batch = [];
        
        this._tags = {};
        this.status = {
            activeRequests: 0,
            failedRequests: 0,
            message: ""
        };
    }
    load(slug) {
        if (this.loadStarted[slug]) {
            return;
        }
        
        this.loadStarted[slug] = true;
        
        fb.db.ref(`/tagged_clarifs/${slug}`).once("value", (snapshot) => {
            let _tags = snapshot.val();
            for (let key in _tags) {
                _tags[key] = fbValToArray(_tags[key]);
            }
            this._tags = _tags;
            
            if (!trees[slug]) {
                getTree(slug, this.loadTreeClarifs.bind(this));
            } else {
                this.loadTreeClarifs(trees[slug]);
            }
        });
    }
    loadTreeClarifs(tree) {
        for (let child of tree.children) {
            if (child.hasOwnProperty("children")) {
                this.loadTreeClarifs(child);
            } else {
                this.loadTopicClarifs(child);
            }
        }
    }
    loadTopicClarifs(topic) {
        this.setStatus({
            activeRequests: this.status.activeRequests + 1,
            message: `Loading topic: ${topic.title}...`
        });
        sendReq({
            url: formatString(data.API_PATH + data.apiSlugs.topic, {
                lang: this.lang,
                topicSlug: topic.slug
            }),
            cb: (data, status) => {
                if (status === "success") {
                    for (let child of data.children) {
                        switch (child.kind) {
                            case "Video":
                                this.loadContentClarifs(child, topic
                                    .video_slug_map[child.id], topic.relative_url);
                            break;
                            case "Article":
                                this.loadContentClarifs(child, child.internalId,
                                    topic.relative_url);
                            break;
                        }
                    }
                }
            },
            fail: () => {
                this.setStatus({
                    failedRequests: this.status.failedRequests + 1,
                    message: `Failed to load topic: ${topic.title}.`
                });
            },
            end: () => {
                this.setStatus({
                    activeRequests: this.status.activeRequests - 1,
                    message: `Loaded topic: ${topic.title}.`
                });
            }
        });
    }
    loadContentClarifs(content, id, relUrl) {
        this.setStatus({
            activeRequests: this.status.activeRequests + 1,
            message: `Loading clarifications for ${content.title}...`
        });
        sendReq({
            url: formatString(data.API_PATH + data.apiSlugs.clarifications, {
                type: (content.kind === "Article") ? "article" : "youtubevideo",
                id: id,
                lang: this.lang
            }),
            cb: (data, status) => {
                if (status === "success") {
                    let kind = (content.kind || "unknown").toLowerCase();
                    this.addToBatch(data.feedback.map(mapClarifs
                        .bind(mapClarifs, kind, this.lang, this._tags, relUrl)));
                }
            },
            fail: () => {
                this.setStatus({
                    failedRequests: this.status.failedRequests + 1,
                    message: `Failed to load clarifications for ${content
                        .title}.`
                });
            },
            end: () => {
                this.setStatus({
                    activeRequests: this.status.activeRequests - 1,
                    message: `Loaded clarifications for ${content.title}.`
                });
            }
        });
    }
    setStatus(status) {
        let {
            activeRequests = this.status.activeRequests,
            failedRequests = this.status.failedRequests,
            message = this.status.message
        } = status;
        
        this.status = {
            activeRequests: activeRequests,
            failedRequests: failedRequests,
            message: message
        }
        
        this.fire("status-changed", status);
    }
    addToBatch(clarifs) {
        this.batch.push.apply(this.batch, clarifs);
        if (this.batch.length >= data.MAX_BATCH_SIZE ||
            this.status.activeRequests <= 1) {
            this.fire("clarifs-loaded", this.batch);
            this.batch = [];
        }
    }
    refresh() {
        // TODO (Joshua): Implement this.
    }
}

let loader = new Loader(page.getParam("lang"));

export default {
    load(slug) {
        if (page.getParam("lang") !== loader.lang) {
            loader = new Loader(page.getParam("lang"));
            events.fire("clarifs-reset");
        }
        
        loader.on("clarifs-loaded", (clarifs) => {
            events.fire("clarifs-added", clarifs);
        });
        loader.on("status-changed", () => {
            events.fire("status-changed", loader.status);
        });
        
        loader.load(slug);
    },
    loadStarted(slug) {
        return page.getParam("lang") === loader.lang &&
            !!loader.loadStarted[slug];
    }
};
