import events from "events";
import utils from "./utils.js";

let {uid} = utils;

class EventEmitter {
    constructor() {
        this.uid = uid();
        this._emitter = new events.EventEmitter();
    }
    on(evtName, cb) {
        this._emitter.on(evtName, cb);
        return this;
    }
    once(evtName, cb) {
        this._emitter.once(evtName, cb);
        return this;
    }
    off(evtName, cb) {
        this._emitter.removeListener(evtName, cb);
        return this;
    }
    fire(...args) {
        this._emitter.emit.apply(this._emitter, args);
    }
}

export default EventEmitter;
