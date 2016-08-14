let params = {};
let href = window.location.href;

function stringifyParams() {
    return Object.keys(params).map(key => `${key}=${params[key]}`).join("&");
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
