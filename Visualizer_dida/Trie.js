class Trie {

    constructor() {
        this.values = [];
        this.sons = {};
    }

    feed(string, value) {
        for (let i=0; i < string.length; ++i) {
            const to_feed = string.substr(i, string.length) + string.substr(0, i);
            this.feed_rec(to_feed, value);
        }
    }

    feed_rec(string, value) {
        if (string.length == 0) {
            this.values.push(value);
            return;
        }
        const firstChar = string[0];
        if (this.sons[firstChar] == undefined) this.sons[firstChar] = new Trie();
        this.sons[firstChar].feed_rec(string.substr(1, string.length - 1), value);
    }

    getChilds(string) {
        if (string.length == 0) {
            let tab = this.values;
            for (let key in this.sons) {
                tab = tab.concat(this.sons[key].getChilds(""));
            }
            return tab;
        }

        const firstChar = string[0];
        if (this.sons[firstChar] == undefined) return [];
        return this.sons[firstChar].getChilds(string.substr(1, string.length - 1));
    }
}
