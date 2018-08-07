import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import secrets from "./secret/secrets.json";
import data from "./data.js";

firebase.initializeApp(secrets.fbCfg);

let cache = {};

export default {
    firebase: firebase,
    db: firebase.database(),
    auth: firebase.auth(),
    load(path, cb) {
        if (!cache.hasOwnProperty(path)) {
            cache[path] = {
                data: null,
                loaded: false,
                cbs: [cb]
            };
            
            this.db.ref(path).once("value").then((snapshot) => {
                cache[path].data = snapshot.val();
                for (let cb of cache[path].cbs) {
                    cb(cache[path].data);
                }
                cache[path].cbs = [];
            });
        } else if (!cache[path].loaded) {
            cache[path].cbs.push(cb);
        } else {
            cb(cache[path].data);
        }
    }
};
