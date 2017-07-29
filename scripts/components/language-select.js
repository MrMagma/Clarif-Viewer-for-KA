import fb from "../fb-wrapper.js";
import page from "../page.js";
import events from "../events/events.js";

events.fire("filter-changed", {
    language: (clarif) => {
        return clarif.lang === page.getParam("lang");
    }
});

class LanguageSelect {
    constructor(domSelector) {
        this.$domNode = $("<select>")
            .change(this.handleLangChange.bind(this));
        
        fb.db.ref("/data/languages").once("value", (snapshot) => {
            this.handleLangLoad(snapshot.val());
        });
        
        $(domSelector).append(this.$domNode);
    }
    handleLangLoad(languages) {
        this.$domNode.append(languages.map(lang =>
            $("<option>")
                .attr("value", lang.bld)
                .attr("selected", lang.bld === page.getParam("lang"))
                .text(lang.name)));
        
        this.$domNode.material_select();
        
        events.fire("lang-changed");
        events.fire("filter-changed");
    }
    handleLangChange(evt) {
        page.setParam("lang", evt.currentTarget.selectedOptions[0].value);
        events.fire("lang-changed");
        events.fire("filter-changed");
    }
}

export default LanguageSelect;
