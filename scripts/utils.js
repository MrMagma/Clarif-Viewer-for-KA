export default {
    formatString(str, data) {
        return str.replace(/\{\{(.+?)\}\}/g, (match, p1) => data[p1]);
    },
    uid: (function() {
        let id = 0;
        return () => id++;
    })(),
    fbValToArray(fbVal) {
        return Object.keys(fbVal).map(key => fbVal[key]);
    }
};
