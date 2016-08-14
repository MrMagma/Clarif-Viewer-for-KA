import page from "../page.js";
import data from "../data.js";
import utils from "../utils.js";
import {tag as tagCreator} from "./creators.js";
import fb from "../fb-wrapper.js";

let {formatString} = utils;
let urlRegex = /((?:https?:\/\/)?(?:[a-z0-9]+\.)?(?:[a-z0-9]+\.[a-z0-9]+)[a-z0-9\-\.\_\~\:\/\?\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=]*)/gi;

let tags = {};
fb.db.ref("/data/tags").on("value", (snapshot) => {
    tags = snapshot.val();
});

function formatText(text) {
    return text
        .replace(/&([^\s]*)/g, "&amp;$1")
        .replace(/</g, "&lt;")
        .replace(urlRegex, "<a href=\"$1\" target=\"_blank\">$1</a>");
        // .replace(/\*(.?)\*/g, "<b>$1</b>")
        // .replace(/_(.?)_/g, "<i>$1</i>");
}

function handleAddTagClick() {
    $("#tag-modal").openModal();
}

class ClarifElement {
    constructor(clarif, id) {
        let url = `${data.KA_URL}${clarif.path}?qa_expand_key=${clarif.expandKey}`;
        this.$domNode = $("<div>")
            .addClass("card-panel cvka-clarif")
            .append(
                clarif.content.split("\n")
                    .map(p => $("<p>")
                        .html(formatText(p))
                        .addClass("cvka-clarif-paragraph"))
            )
            .append($("<hr>"))
            .append(
                $("<p>")
                    .text("Clarification on ")
                    .addClass("cvka-clarif-slug")
                    .append(
                        $("<a>")
                            .attr("href",
                                formatString(url, {
                                    lang: page.getParam("lang")
                                }))
                            .addClass("cvka-clarif-slug-link")
                            .text(clarif.path)
                    )
            );
        this.$tags = $("<div>")
            .addClass("cvka-clarif-tags-container");
        this.votes = clarif.votes;
        this.epoch = clarif.epoch;
        this.tags = clarif.tags.filter(tag => tags.hasOwnProperty(tag));
        this.path = clarif.parentSlug
            .slice(1, clarif.parentSlug.length).split("/");
        this.lang = clarif.lang;
        this.domainSlug = clarif.domainSlug;
        this.expandKey = clarif.expandKey;
        
        this.setTags(this.tags);
        this.$domNode.append($("<div>")
            .addClass("cvka-clarif-tags")
            .append(this.$tags)
            .append($("<a>")
                .attr({
                    "href": "javascript: void(0);",
                    "data-id": id
                })
                .addClass("cvka-clarif-add-tag cvka-clarif-tag")
                .text("Add tag")));
    }
    setTags(tagIds) {
        this.$tags.html("");
        this.$tags.append(tagIds.map(tagId => tagCreator(tags[tagId])));
    }
}

export default ClarifElement;
