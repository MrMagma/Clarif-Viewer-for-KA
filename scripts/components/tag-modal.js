import {tag as tagCreator} from "./creators.js";
import events from "../events.js";
import EventEmitter from "../event-emitter.js";
import fb from "../fb-wrapper.js";

let data = {
    events: new EventEmitter()
};

let colors = [
    "red",
    "pink",
    "purple",
    "deep-purple",
    "indigo",
    "blue",
    "light-blue",
    "cyan",
    "teal",
    "green",
    "light-green",
    "lime darken-1",
    "yellow darken-2",
    "amber darken-1",
    "orange darken-1",
    "deep-orange",
    "brown",
    "grey",
    "blue-grey",
    "black"
];

let tags = {};
fb.db.ref("/data/tags").on("value", (snapshot) => {
    tags = snapshot.val();
    data.events.fire("tags-updated");
});

class _TagCreator {
    constructor($parent) {
        this.$domNode = $parent.find(".js-new-tag");
        this.$dialog = $parent.find(".js-tag-options");
        this.$createTag = $parent.find(".js-create-tag");
        this.$preview = this.$domNode.find(".js-tag-preview");
        this.$nameInput = this.$domNode.find(".js-tag-name")
            .on("input", this.changeName.bind(this));
        this.tag = {
            color: colors[0],
            name: "new-tag",
            internal: false
        };
        
        this.$domNode.find(".js-tag-color").append(colors.map(color =>
            $("<div>")
                .addClass(`${color} cvka-color-swatch`)
                .click(this.changeColor.bind(this, color))));
        this.$domNode.find(".js-add-tag-btn").click(this.saveTag.bind(this));
        this.$domNode.find(".js-cancel-create-btn").click(this.reset.bind(this));
        this.$createTag.find(".js-create-tag-btn").click(this.showDialog.bind(this));
        this.reset();
    }
    changeColor(color) {
        this.tag.color = color;
        this.updatePreview();
    }
    changeName() {
        let name = this.$nameInput.val();
        this.tag.name = (name.length > 0) ? name : "new-tag";
        this.updatePreview();
    }
    updatePreview() {
        this.$preview.html("");
        this.$preview.append(tagCreator(this.tag));
    }
    saveTag() {
        fb.db.ref("/data/tags").push(this.tag);
        this.reset();
    }
    reset() {
        this.tag = {
            color: colors[0],
            name: "new-tag",
            internal: false
        };
        this.$nameInput.val("");
        this.updatePreview();
        this.hideDialog();
    }
    showDialog() {
        this.$dialog.css("display", "block");
        this.$createTag.css("display", "none");        
    }
    hideDialog() {
        this.$dialog.css("display", "none");
        this.$createTag.css("display", "block");
    }
}

class TagModal {
    constructor(id) {
        this.$domNode = $(`#${id}`);
        this.$allTags = this.$domNode.find(".js-all-tags")
            .click(this.handleAllClick.bind(this));
        this.$currentTags = this.$domNode.find(".js-current-tags")
            .click(this.handleCurrentClick.bind(this));
        
        this._data = {};
        events.on("show-tag-modal", this.handleShow.bind(this));
        data.events.on("tags-updated", this.handleTagChange.bind(this));
        
        this.$domNode.find(".js-tags-save-btn")
            .click(this.handleSave.bind(this));
        this.$domNode.find(".js-tags-cancel-btn")
            .click(this.handleCancel.bind(this));
        
        new _TagCreator(this.$domNode);
        
        this.handleTagChange();
    }
    handleShow(data) {
        this._data = data;
        this.updateCurrentTags();
        this.$domNode.openModal();
    }
    handleTagChange() {
        this.$allTags.html("");
        this.$allTags.append(Object.keys(tags).filter(key =>
            !tags[key].internal).map(tag => tagCreator(tags[tag], tag)));
    }
    updateCurrentTags() {
        this.$currentTags.html(this._data.tags
            .filter(tag => !tags[tag].internal)
            .map(tag => tagCreator(tags[tag], tag)));
    }
    handleAllClick(evt) {
        let dataset = evt.target.dataset;
        if (dataset.tagId != null &&
            this._data.tags.indexOf(dataset.tagId) === -1) {
            this._data.tags.push(dataset.tagId);
            this.updateCurrentTags();
        }
    }
    handleCurrentClick(evt) {
        let dataset = evt.target.dataset;
        if (dataset.tagId != null) {
            let ind = this._data.tags.indexOf(dataset.tagId);
            if (ind !== -1) {
                this._data.tags.splice(ind, 1);
                this.updateCurrentTags();
            }
        }
    }
    handleSave() {
        fb.db.ref(`/tagged_clarifs/${this._data.domainSlug}/${this._data.expandKey}`)
            .set(this._data.tags.filter(tag => !tags[tag].internal))
            .catch(() => {
                Materialize.toast("Unable to set tags. Make sure that you're logged in and you have the proper permissions", 5000);
                this.reset();
            })
            .then(() => {
                events.fire("tag-change", this._data, this._data.tags);
                this.reset();
            });
        this.$domNode.closeModal();
    }
    handleCancel() {
        this.reset();
        this.$domNode.closeModal();
    }
    reset() {
        // this._data = {};
    }
}

export default TagModal;
