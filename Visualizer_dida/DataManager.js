class DataManager {

    constructor() {
        this.data_str = {};
        this.data_full = {};

        this.positions = {};
        this.data_only = [];

        this.current_key = [];
        this.setKey("000");
    }

    feed(data_path, data_strings) {
        for (let key in data_strings) {
            this.data_str[key.split('')] = loadStrings(
                data_path + data_strings[key]
            );
        }
    }

    initialize() {
        for (let key in this.data_str) {
            this.data_full[key] = this.loadData(this.data_str[key]);
        }

        // Splitting infos and positions

        // Positions
        for (let key in this.data_full) {
            this.positions[key] = this.data_full[key].map( sample => {
                return {
                    DidaID: sample.DidaID,
                    x: +sample.x,
                    y: +sample.y
                };
            });
        }

        // Infos
        this.data_only = this.data_full['111'.split('')].map( sample => {
            const newObject = {};
            for (let key in sample) {
                if (key != 'x' && key != 'y')
                    newObject[key] = sample[key];
            }
            return new Sample(newObject);
        });

        // We free useless memory
        delete this.data_str;
        delete this.data_full;

        this.moveData();
    }

    get key() {
        return this.current_key;
    }

    get data() {
        return this.data_only;
    }

    moveData() {
        this.data.map( (sample, index) => {
            const position = this.positions[this.key][index];
            sample.updateDest(
                position.x, position.y
            );
        });
    }

    setKey(key) {
        if (typeof key === "string") key = key.split('').map(k => +k);
        this.current_key = key;
        this.moveData();

        // Bubble size update
        constants.BUBBLE_HEIGHT = 110 + 20 * this.key.reduce(
            (prev, curr)  => prev + (+curr), 0
        );
        constants.BUBBLE_CIRCLE_HEIGHT = 115 + 25 * this.key.reduce(
            (prev, curr)  => prev + (+curr), 0
        );

        this.data.map(sample => sample.bubbleCheck());
    }

    changeKey(pos) {
        const newKey = this.key;
        newKey[pos] = 1 - +newKey[pos];
        this.setKey(newKey);
    }

    loadData(string) {
        const attributes = string[0].split(',');
        const container = [];
        for (let values of string.map(x => x.split(','))) {
            const current_obj = {}
            for (let i=0; i<attributes.length; ++i) {
                current_obj[attributes[i]] = values[i];
            }
            container.push(current_obj);
        }

        //Removes header
        container.shift();
        return container;
    }
}
