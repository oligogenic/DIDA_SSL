class Searcher {
    constructor() {
        this.toggled = false;
        this.barCounter = constants.SEARCHER_BAR_SPEED;
        this.removeDelay = 0;
        this.barShown = true;

        this.trie = new Trie();

        this.text = "";
        this.suggestedtexts = [];
        this.toggle_n = -1;

        this.data = undefined;
    }

    // Is mouse onto it ?
    onto(x, y) {
        return(pointInRect(
            x,
            y,
            constants.SEARCHER_LEFT_MARGIN,
            (
                constants.HEIGHT -
                constants.SEARCHER_BOTTOM_MARGIN -
                constants.SEARCHER_FONT_SIZE -
                5
            ),
            constants.SEARCHER_WIDTH,
            constants.SEARCHER_FONT_SIZE + 5)
        );
    }

    feed(data) {
        this.data = data;
        for (key in this.data) {
            this.trie.feed(data[key].id.toLowerCase(), data[key]);
            this.trie.feed(data[key].Name.toLowerCase(), data[key]);
            const genes = data[key].Pair.split('/');
            this.trie.feed(genes[0].toLowerCase(), data[key]);
            this.trie.feed(genes[1].toLowerCase(), data[key]);
        }
        this.toggle(false);
    }

    toggle(bool) {
        this.toggled = bool;
        this.barShown = true;
        this.barCounter = constants.SEARCHER_BAR_SPEED;

        if (!this.toggled) {
            this.suggestedtexts = [];
            this.data.map( sample => sample.toggleHighlight(false));
        } else {
            this.suggest();
        }

        if (this.toggled && this.text == constants.SEARCHER_DEFAULT)
            this.text = "";
        if (!this.toggled && this.text == "")
            this.text = constants.SEARCHER_DEFAULT;
    }

    resetRemoveDelay() {
        this.removeDelay = 0;
    }

    removeLastChar() {
        if (!this.toggled) return;

        if (this.text.length == 0) {
            this.data.map( sample => sample.toggleHighlight(false));
            return;
        }

        this.removeDelay -= 1
        if (this.removeDelay > 0) return;

        this.text = this.text.slice(0, -1);
        this.removeDelay = constants.SEARCHER_REMOVE_DELAY;
        this.suggest();
    }

    sendKey(key) {
        if (!this.toggled) return;
        if (key === '\n') return;
        if (textWidth(this.text) >= constants.SEARCHER_WIDTH - 10) return;
        this.text += key;

        if (this.text.length == 0) return;

        this.suggest();
    }

    addSuggestion(text) {
        if (this.suggestedtexts.includes(text)) return;
        this.suggestedtexts.push(text);
    }

    suggest() {
        const suggestions = this.trie.getChilds(this.text.toLowerCase());
        if (suggestions.length == 0) {
            this.suggestedtext = "";
            this.data.map( sample => sample.toggleHighlight(false));
            return;
        }
        this.suggestedtexts = [];
        let i = 0;
        while (i < suggestions.length && this.suggestedtexts.length < constants.SEARCHER_N_SUGGESTIONS) {
            const child = suggestions[i];
            const child_id = child.id;
            const child_name = child.Name;
            const child_genes = child.Pair.split('/');
            if (
                child_id.toLowerCase().includes(this.text.toLowerCase())
            ) {
                this.addSuggestion(child_id);
            } else if (
                child_name.toLowerCase().includes(this.text.toLowerCase())
            ) {
                this.addSuggestion(child_name);
            } else if (
                child_genes[0].toLowerCase().includes(this.text.toLowerCase())
            ) {
                this.addSuggestion(child_genes[0]);
            } else {
                this.addSuggestion(child_genes[1]);
            }
            i++;
        }


        this.data.map( sample => sample.toggleHighlight(false));
        suggestions.map( sample => sample.toggleHighlight(true));
    }

    moveUp() {
        if (!this.toggled) return;
        if (this.toggle_n < this.suggestedtexts.length - 1)
            this.toggle_n += 1;
    }

    moveDown() {
        if (!this.toggled) return;
        if (this.toggle_n > -1)
            this.toggle_n -= 1;
    }

    validateSuggestion() {
        if (!this.toggled) return;
        if (this.toggle_n == -1) return;
        this.text = this.suggestedtexts[this.toggle_n];
        this.suggestedtexts = [];
        this.toggle_n = -1;
        this.suggest();
    }

    draw() {
        fill(255);
        strokeWeight(1);
        stroke(color_from_array(constants.COLOR_UK_D));
        translate(
            constants.SEARCHER_LEFT_MARGIN,
            (
                constants.HEIGHT -
                constants.SEARCHER_BOTTOM_MARGIN -
                constants.SEARCHER_FONT_SIZE -
                5
            )
        );

        rect(
            0,
            0,
            constants.SEARCHER_WIDTH,
            constants.SEARCHER_FONT_SIZE + 5
        );

        if (this.toggled && this.toggle_n === -1) {
            textStyle(NORMAL);
            stroke(color_from_array(constants.COLOR_UK_D));
            fill(color_from_array(constants.COLOR_UK_D));
        } else {
            textStyle(ITALIC);
            stroke(color_from_array(constants.COLOR_UK));
            fill(color_from_array(constants.COLOR_UK));
        }

        textSize(constants.SEARCHER_FONT_SIZE);
        strokeWeight(0.8);
        text(this.text, 5, constants.SEARCHER_FONT_SIZE);

        textStyle(NORMAL);

        let offy = -2;
        for (let i=0; i < this.suggestedtexts.length; ++i) {
            if (i == this.toggle_n) {
                stroke(color_from_array(constants.COLOR_UK_D));
                fill(color_from_array(constants.COLOR_UK_D));
            } else {
                stroke(color_from_array(constants.SEARCHER_SUGGEST_COLOR));
                fill(color_from_array(constants.SEARCHER_SUGGEST_COLOR));
            }
            text(
                this.suggestedtexts[i],
                5,
                offy
            );
            offy -= constants.SEARCHER_FONT_SIZE;
        }

        stroke(color_from_array(constants.COLOR_UK_D));
        fill(color_from_array(constants.COLOR_UK_D));

        // Line blinking
        if (this.toggled) {
            const width = textWidth(this.text);
            if (this.barShown)
                line(5 + width, 3, 5 + width, constants.SEARCHER_FONT_SIZE + 2);
            this.barCounter -= 1;
            if (this.barCounter <= 0) {
                this.barCounter = constants.SEARCHER_BAR_SPEED;
                this.barShown = !this.barShown;
            }
        }


        stroke(color_from_array(constants.COLOR_UK));
        textSize(12);
        strokeWeight(1);
        stroke(100);
        textStyle(ITALIC);
        text(constants.SEARCHER_PANEL_TEXT, 0, constants.SEARCHER_FONT_SIZE + 18);
        textStyle(NORMAL);

        translate(
            -constants.SEARCHER_LEFT_MARGIN,
            (
                - constants.HEIGHT +
                constants.SEARCHER_BOTTOM_MARGIN +
                constants.SEARCHER_FONT_SIZE +
                5
            )
        );
        textStyle(NORMAL);
    }
}
