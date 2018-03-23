import EventEmitter from "../events/event-emitter.js";

class SelectGroup extends EventEmitter {
    constructor(domSelector, cfg) {
        super();
        this.$domNode = $("<div>");
        this.$selects = [];
        this._data = {};
        
        $(domSelector).append(this.$domNode);
    }
    set(cfg) {
        this.$domNode.html("");
        this.$selects = [];
        this._data = {};
        
        this.$domNode.append(cfg.map(select => this.$generateChild(select)));
        
        for (let $select of this.$selects) {
            $select.material_select();
        }
    }
    $generateChild(cfg) {
        if (cfg.selections) {
            cfg.selected = [];
            for (let i = 0; i < cfg.selections.length; ++i) {
                if (cfg.selections[i]) {
                    cfg.selected.push(i);
                }
            }
        }
        
        let $select = this.$generateSelect(cfg);
        this.$selects.push($select);
        this._data[cfg.name] = cfg.options
            .map(opt => opt.value)
            .filter((val, i) => cfg.selected.indexOf(i) !== -1);
        return $("<div>")
            .addClass("row")
            .append(
                $("<div>")
                    .addClass("col s6")
                    .append(
                        $("<p>")
                            .addClass("cvka-select-label right-align")
                            .text(cfg.label || cfg.name)
                    ),            
                $("<div>")
                    .addClass("col s6")
                    .append(
                        $select
                    )
            );
    }
    $generateSelect(cfg) {
        return $("<select>")
            .change(this.onSelectChange.bind(this, cfg.name))
            .attr("name", cfg.name)
            .attr("multiple", cfg.multiple)
            .append(this.$generateOptions(cfg));
    }
    $generateOptions(cfg) {
        return cfg.options.map((opt, i) => {
            return $("<option>")
                .text(opt.text)
                .attr("value", opt.value)
                .attr("selected", (cfg.selected instanceof Array &&
                    cfg.selected.indexOf(i) !== -1));
        });
    }
    getData(key) {
        return this._data[key];
    }
    onSelectChange(name, evt) {
        this._data[name] = [].slice
            .call(evt.currentTarget.selectedOptions)
            .map(el => el.value);
        this.fire("data-changed");
    }
}

export default SelectGroup;
