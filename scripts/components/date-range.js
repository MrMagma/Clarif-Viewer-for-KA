import page from "../page.js";
import events from "../events/events.js";

const ONE_DAY = 86400000;
let start = -Infinity,
    end = Infinity;

events.fire("filter-changed", {
    date: (clarif) => {
        return clarif.epoch >= start && clarif.epoch <= end;
    }
})

class DateRange {
    constructor(domSelector) {

        this.$start = $("<input>")
            .attr("type", "text")
            .attr("placeholder", "The beginning of time")
            .addClass("col s6 datepicker");
        this.$end = $("<input>")
            .attr("type", "text")
            .attr("placeholder", "The end of time")
            .addClass("col s6 datepicker");
        this.$domNode = $("<div>")
            .addClass("col s12")
            .append($("<p>Show only clarifications between these dates</p>")
                .addClass("col s12")
            )
            .append(this.$start)
            .append(this.$end);
        
        this.$start.pickadate({
            selectYears: true,
            selectMonths: true,
            closeOnSelect: true,
            onSet: this.handleStartChange.bind(this)
        });
        this.$end.pickadate({
            selectYears: true,
            selectMonths: true,
            closeOnSelect: true,
            onSet: this.handleEndChange.bind(this)
        });
        
        this.setStart(page.getParam("start-date"));
        this.setEnd(page.getParam("end-date"));
        
        $(domSelector).append(this.$domNode);
    }
    handleStartChange({select: date}) {
        this.setStart(date);
    }
    handleEndChange({select: date}) {
        this.setEnd(date);
    }
    setStart(date = -Infinity) {
        date = (date === "undefined") ? -Infinity : date;
        if (date >= end) {
            date = end - ONE_DAY;
            Materialize.toast("Your start date is not allowed to be the same as or after your end date. It's been set to the nearest valid date.");
        }
        
        let val = "";
        
        if (date !== -Infinity) {
            val = (new Date(date)).toDateString().slice(4, Infinity);
        }
        
        this.$start.val(val);
        this.end = date;
        
        start = date;
        
        page.setParam("start-date", (date === -Infinity) ? undefined : date);        
        events.fire("start-date-changed");
        events.fire("filter-changed");
    }
    setEnd(date = Infinity) {
        date = (date === "undefined") ? Infinity : date;
        if (date <= start) {
            date = start + ONE_DAY;
            Materialize.toast("Your end date is not allowed to be the same as or before your start date. It's been set to the nearest valid date.");
        }
        
        let val = "";
        
        if (date !== Infinity) {
            val = (new Date(date)).toDateString().slice(4, Infinity);
        }
        
        this.$end.val(val);
        end = date;
        
        page.setParam("end-date", (date === Infinity) ? undefined : date);
        events.fire("end-date-changed");
        events.fire("filter-changed");
    }
}

export default DateRange;
