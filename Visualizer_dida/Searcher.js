class Searcher {
    constructor() {
        this.toggled = false;
        this.barCounter = constants.SEARCHER_BAR_SPEED;
        this.removeDelay = 0;
        this.barShown = true;

        this.trie = new Trie();

        this.text = "";
        this.suggestedtext = "";

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
            this.suggestedtext = "";
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
        if (textWidth(this.text) >= constants.SEARCHER_WIDTH - 10) return;
        this.text += key;

        if (this.text.length == 0) return;

        this.suggest();
    }

    suggest() {
        const suggestions = this.trie.getChilds(this.text.toLowerCase());
        if (suggestions.length == 0) {
            this.suggestedtext = "";
            this.data.map( sample => sample.toggleHighlight(false));
            return;
        }
        const suggested_child = suggestions[0];
        const child_id = suggested_child.id;
        const child_name = suggested_child.Name;
        const child_genes = suggested_child.Pair.split('/');
        if (
            child_id.toLowerCase().includes(this.text.toLowerCase())
        ) {
            this.suggestedtext = child_id;
        } else if (
            child_name.toLowerCase().includes(this.text.toLowerCase())
        ) {
            this.suggestedtext = child_name;
        } else if (
            child_genes[0].toLowerCase().includes(this.text.toLowerCase())
        ) {
            this.suggestedtext = child_genes[0];
        } else {
            this.suggestedtext = child_genes[1];
        }

        this.data.map( sample => sample.toggleHighlight(false));
        suggestions.map( sample => sample.toggleHighlight(true));
    }

    validateSuggestion() {
        if (!this.toggled) return;
        this.text = this.suggestedtext;
        this.suggestedtext = "";
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

        if (this.toggled) {
            textStyle(NORMAL);
            stroke(color_from_array(constants.COLOR_UK_D));
            fill(color_from_array(constants.COLOR_UK_D));
        } else {
            textStyle(ITALIC);
            stroke(color_from_array(constants.COLOR_UK));
            fill(color_from_array(constants.COLOR_UK));
        }

        textSize(constants.SEARCHER_FONT_SIZE);
        text(this.text, 5, constants.SEARCHER_FONT_SIZE);

        stroke(color_from_array(constants.SEARCHER_SUGGEST_COLOR));
        fill(color_from_array(constants.SEARCHER_SUGGEST_COLOR));
        text(
            this.suggestedtext,
            5,
            -2
        );

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

        strokeWeight(1);
        textSize(12);
        stroke(100);
        fill(100);
        textStyle(ITALIC);
        textAlign(LEFT);
        text(constants.SEARCHER_PANEL_TEXT, 0, constants.SEARCHER_FONT_SIZE + 18);
        textAlign(LEFT);
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
