class DataManager {

    constructor() {
        this.data_str = "";

        this.positions = {};
        this.samples = [];
        this.lookup = {};

        this.key_str = "";
        this.key_tab = [];
    }

    feed(features_path) {
        this.data_str = loadStrings(constants.DATA_PATH + features_path);
    }

    initialize() {
        const features_tab = this.loadData(this.data_str);

        for (let obj of features_tab) {
            const sample = new Sample(obj);
            this.lookup[obj.DidaID] = sample;
            this.samples.push(sample);
        }

        // Retrieving initial positions
        this.setKey("100010000000");


        // We free useless memory
        delete this.data_str;
    }

    get key() {
        return {
            str: this.key_str,
            tab: this.key_tab
        };
    }

    get data() {
        return this.samples;
    }

    moveData(positions_str) {

        const positions_tab = this.loadData(positions_str);
        for (let obj of positions_tab) {
            this.positions[obj.DidaID] = obj;
        }

        this.data.map( (sample, index) => {
            const pos = this.positions[sample.DidaID];
            sample.updateDest(
                +pos.x + randomGaussian(0, constants.RAND_STD),
                +pos.y + randomGaussian(0, constants.RAND_STD)
            );
        });

        // Bubble size update
        constants.BUBBLE_HEIGHT = 100 + 11 * this.key.tab.reduce(
            (prev, curr)  => prev + (+curr), 0
        );
        constants.BUBBLE_CIRCLE_HEIGHT = 20 + 20 * this.key.tab.reduce(
            (prev, curr)  => prev + (+curr), 0
        );

        this.data.map(sample => sample.bubbleCheck());
    }

    setKey(key) {
        this.key_str = key;
        this.key_tab = key.split('').map(x => parseFloat(x));

        const that = this;
        loadStrings(
            constants.DATA_PATH + constants.POSITION_REGX.replace(
                '*', this.key.str
            ),
            (return_val) => {that.moveData(return_val);}
        );
    }

    changeKey(pos) {
        this.key_tab[pos] = 1 - this.key_tab[pos];
        this.key_str = this.key_tab.join('');
        this.setKey(this.key_str);
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
