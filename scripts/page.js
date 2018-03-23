import {ntob, bton} from "number-to-base64";

let params = {};
let href = window.location.href;

function stringifyParams() {
    return Object.keys(params).map(key => {
        let val = params[key];
        
        if (typeof val === "number") {
            key = "_" + key;
            val = ntob(val)
        } else if (val === undefined) {
            return "";
        }
        
        return `${key}=${val}`;
    }).filter(arg => arg.length > 0).join("&");
}

function updateURL() {
    let sParams = stringifyParams();
    if (window.history) {
        history.pushState(params, "", `?${sParams}`);
    }
    href = `${href.replace(window.location.search, "")}?${sParams}`;
}

export default {
    loadParams(defaults) {
        if (location.search.length > 1) {
            let paramArr = location.search.substring(1).split("&");
            for (let param of paramArr) {
                let [key, value] = param.split("=");
                if (key[0] === "_") {
                    key = key.slice(1, key.length);
                    value = bton(value);
                }
                params[key] = value;
            }
        }
        
        for (let key in defaults) {
            if (defaults.hasOwnProperty(key) && !params.hasOwnProperty(key)) {
                params[key] = defaults[key];
            }
        }
    },
    getParam(key) {
        return params[key];
    },
    setParam(key, value) {
        params[key] = value;
        updateURL();
    },
    reload() {
        window.location.href = href;
    }
};
