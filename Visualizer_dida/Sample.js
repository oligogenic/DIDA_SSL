class Sample {
    constructor(obj) {
        for (let key in obj) {
            this[key] = obj[key];
        }
        if (this.DE == 'CO2' || this.DE == 'TD2') this.DE = 'UK';
        this.color = (
            (this.DE == 'TD') ? color_from_array(constants.COLOR_TD) :
            (this.DE == 'CO') ? color_from_array(constants.COLOR_CO) :
            (this.DE == 'UK') ? color_from_array(constants.COLOR_UK) :
            (this.DE == 'DD') ? color_from_array(constants.COLOR_DD) :
            color('white')
        );
        this.color_d = (
            (this.DE == 'TD') ? color_from_array(constants.COLOR_TD_D) :
            (this.DE == 'CO') ? color_from_array(constants.COLOR_CO_D) :
            (this.DE == 'UK') ? color_from_array(constants.COLOR_UK_D) :
            (this.DE == 'DD') ? color_from_array(constants.COLOR_DD_D) :
            color('white')
        );
        this.color_l = (
            (this.DE == 'TD') ? color_from_array(constants.COLOR_TD_L) :
            (this.DE == 'CO') ? color_from_array(constants.COLOR_CO_L) :
            (this.DE == 'UK') ? color_from_array(constants.COLOR_UK_L) :
            (this.DE == 'DD') ? color_from_array(constants.COLOR_DD_L) :
            color('white')
        );
        this.custom_color = null;
        this.radius = constants.RADIUS;

        this.active = false;
        this.sense = 0;

        this.x = 0;
        this.y = 0;

        this.true_x = 0;
        this.true_y = 0;

        this.dest_x = 0;
        this.dest_y = 0;

        this.bubble_width = 0;
        this.bubble_height = 0;

        this.bubble_width_t = 0;
        this.bubble_height_t = 0;

        this.bubble_modifier_x = (this.true_x <= constants.WIDTH / 2)  ? 1 : -1;
        this.bubble_modifier_y = (this.true_y <= constants.HEIGHT / 2) ? 1 : -1;

        this.name_shown = false;

        this.highlighted = false; // If seach engine suggests it

        this.bubbleAppeared = false;

        this.features_tab = [
            this.CADD1,
            this.CADD2,
            this.RecA,
            this.EssA,
            this.CADD3,
            this.CADD4,
            this.RecB,
            this.EssB,
            this.Distance,
            this.Path,
            this.CoExp,
            this.AllelicState
        ].map(x => parseFloat(x));
    }

    setColor(color) {
        if (this.custom_color && arraysEqual(color, this.custom_color.levels))
            this.removeColor();
        else
            this.custom_color = color_from_array(color);
    }

    removeColor() {
        this.custom_color = null;
    }

    updateDest(x, y) {
        this.dest_x = get_scale(
            x,
            constants.MIN_X,
            constants.MAX_X,
            constants.WIDTH
        );
        this.dest_y = get_scale(
            y,
            constants.MIN_Y,
            constants.MAX_Y,
            constants.HEIGHT
        );;
        this.bubble_modifier_x = (this.dest_x <= constants.WIDTH / 2)  ? 1 : -1;
        this.bubble_modifier_y = (this.dest_y <= constants.HEIGHT / 2) ? 1 : -1;
    }

    toggleHighlight(bool) {
        this.highlighted = bool;
    }

    toggleActive(bool) {
        this.active = bool;
        if (!this.active) this.radius = constants.RADIUS;
    }

    toggleBubble(bool) {
        this.bubble = bool;
        if (this.bubble) this.bubbleAppear();
        else this.bubbleDisappear();
    }

    bubbleAppear() {
        this.bubble_width_t = constants.BUBBLE_WIDTH;
        this.bubble_height_t = constants.BUBBLE_HEIGHT;
        this.bubbleAppeared = true;
    }

    bubbleDisappear() {
        this.bubble_width_t = 0;
        this.bubble_height_t = 0;
        this.bubbleAppeared = false;

        if (constants.COLOR_CHART_LINKED === this) {
            constants.COLOR_CHART_X = -1
            constants.COLOR_CHART_Y = -1
            constants.COLOR_CHART_LINKED = null;
        }
    }

    bubbleCheck() {
        if (this.bubbleAppeared)
            this.bubbleAppear();
        else
            this.bubbleDisappear();
    }

    isDisabled() {
        return (!this.custom_color &&
            (
                (this.DE == 'UK') && constants.UK_DISABLED ||
                (this.DE == 'CO') && constants.CO_DISABLED ||
                (this.DE == 'TD') && constants.TD_DISABLED ||
                (this.DE == 'DD') && constants.DD_DISABLED
            )
        );
    }

    update() {

        if (this.true_x != this.dest_x || this.true_y != this.dest_y) {
            const dP = createVector(
                this.dest_x - this.true_x,
                this.dest_y - this.true_y
            );
            const dP_normed = dP.div(constants.SAMPLES_SPEED);
            this.true_x += dP_normed.x;
            this.true_y += dP_normed.y;
            const dP2 = createVector(
                this.dest_x - this.true_x,
                this.dest_y - this.true_y
            );
            if (dP.x * dP2.x < 0) this.true_x = this.dest_x;
            if (dP.y * dP2.y < 0) this.true_y = this.dest_y;
        }


        if (!this.active) return;

        if ( this.sense == 0 ) { // Increasing
            if (this.radius > constants.MAX_RADIUS) this.sense = 1;
            else this.radius += constants.SAMPLE_GROWTH_RATE;
        } else { // Decreasing
            if (this.radius < constants.MIN_RADIUS) this.sense = 0;
            else this.radius -= constants.SAMPLE_GROWTH_RATE;
        }
    }

    draw(highlighted_samples) {

        if (this.isDisabled()) return;

        if (this.custom_color) {
            strokeWeight(0.5);
            stroke(0);
            fill(this.custom_color);
        } else {

            if (!highlighted_samples) {
                stroke(this.color);
                fill(this.color);
            } else if (!this.highlighted) {
                stroke(this.color_l);
                fill(this.color_l);
            } else {
                stroke(this.color_d);
                fill(this.color_d);
            }
        }

        strokeWeight(1);
        ellipse(
            this.true_x,
            this.true_y,
            this.radius*2, this.radius*2
        );
    }
    updateBubble() {
        const dx = this.bubble_width_t - this.bubble_width;
        const dy = this.bubble_height_t - this.bubble_height;

        if (dx > 0) {
            this.bubble_width = Math.min(
                this.bubble_width_t,
                this.bubble_width + constants.BUBBLE_GROWTH_W
            );
        } else if (dx < 0) {
            this.bubble_width = Math.max(
                0,
                this.bubble_width - constants.BUBBLE_GROWTH_W
            );
        }

        if (dy > 0) {
            this.bubble_height = Math.min(
                this.bubble_height_t,
                this.bubble_height + constants.BUBBLE_GROWTH_H
            );
        } else if (dy < 0) {
            this.bubble_height = Math.max(
                0,
                this.bubble_height - constants.BUBBLE_GROWTH_H
            );
        }
    }

    toggleName(bool) {
        this.name_shown = bool;
    }

    drawName() {
        if (!this.name_shown) return;

        if (this.isDisabled()) return;

        stroke(this.color_d);

        strokeWeight(2);
        stroke(255);
        fill(this.color_d);
        textStyle(BOLD);
        textSize(constants.TEXT_SIZES[0] - 2);
        const x_flag = (
            (this.true_x > constants.WIDTH / 2) ?
            this.true_x - textWidth(this.Name) - 5 :
            this.true_x + 5
        );
        text(this.Pair, x_flag, this.true_y - constants.TEXT_SIZES[0] - 2);
        text(this.Name, x_flag, this.true_y - 2);
        textStyle(NORMAL);
    }

    drawBubble() {
        if (!this.bubble_width) return;

        if (this.isDisabled()) return;

        fill(255);
        stroke(this.color);
        strokeWeight(2);
        rect(this.true_x, this.true_y,
            this.bubble_modifier_x * this.bubble_width,
            this.bubble_modifier_y * this.bubble_height
        );

        // Bubble is not full, we do not write the text.
        if (this.bubble_width !== this.bubble_width_t) return;

        // Bubble is full
        const tx = (this.bubble_modifier_x == 1) ? 0 : -constants.BUBBLE_WIDTH;
        const ty = (this.bubble_modifier_y == 1) ? 0 : -constants.BUBBLE_HEIGHT;

        translate(this.true_x + tx, this.true_y + ty);

        fill(this.color_d);
        stroke(this.color_d);

        // Disease

        strokeWeight(1);
        let size = constants.TEXT_SIZES[0];
        textSize(size);
        while (textWidth(this.Name) >= constants.BUBBLE_WIDTH - 10) {
            size -= 0.2;
            textSize(size);
        }
        text(this.Name, 2, size);

        let offset_y = size + 10;

        const gene_names = this.Pair.split('/');

        // GENE 1

        strokeWeight(1);
        textSize(constants.TEXT_SIZES[1]);
        text(gene_names[0], 3, constants.TEXT_SIZES[1] + offset_y);
        offset_y += constants.TEXT_SIZES[1] + 2;

        textSize(constants.TEXT_SIZES[2]);
        for (let i=0; i < 4; ++i) {

            if (!+data_manager.key.tab[i]) continue;
            text(
                constants.FEATURES_TEXTS_S[i] + ": " + Math.round(100*this.features_tab[i])/100,
                3,
                constants.TEXT_SIZES[2] + offset_y
            );

            offset_y += constants.TEXT_SIZES[2] + 2;
        }

        // GENE 2

        offset_y += 5;

        strokeWeight(1);
        textSize(constants.TEXT_SIZES[1]);
        text(gene_names[1], 3, constants.TEXT_SIZES[1] + offset_y);
        offset_y += constants.TEXT_SIZES[1] + 2;

        textSize(constants.TEXT_SIZES[2]);
        for (let i=4; i < 8; ++i) {

            if (!+data_manager.key.tab[i]) continue;

            text(
                constants.FEATURES_TEXTS_S[i] + ": " + Math.round(100*this.features_tab[i])/100,
                3,
                constants.TEXT_SIZES[2] + offset_y
            );

            offset_y += constants.TEXT_SIZES[2] + 2;
        }

        // Combinations

        offset_y += 5;

        strokeWeight(1);
        textSize(constants.TEXT_SIZES[1]);
        text("Combination-related", 3, constants.TEXT_SIZES[1] + offset_y);
        offset_y += constants.TEXT_SIZES[1] + 2;

        textSize(constants.TEXT_SIZES[2]);
        for (let i=8; i < 12; ++i) {

            if (!+data_manager.key.tab[i]) continue;

            text(
                constants.FEATURES_TEXTS_S[i] + ": " + this.features_tab[i],
                3,
                constants.TEXT_SIZES[2] + offset_y
            );

            offset_y += constants.TEXT_SIZES[2] + 2;
        }

        // Digenic combination

        strokeWeight(1.5);
        textSize(constants.TEXT_SIZES[0]);
        text(
            this.id,
            constants.BUBBLE_WIDTH - textWidth(this.id) - 5,
            constants.BUBBLE_HEIGHT - 5
        );

        // Digenic effect
        text(
            this.DE,
            constants.BUBBLE_WIDTH - textWidth(this.DE) - 5,
            constants.BUBBLE_HEIGHT - 5 - constants.TEXT_SIZES[0]
        );

        const color_chart_offx = (
            5 + 4*constants.COLOR_CHART_SIDE*constants.RADIUS
        );
        const color_chart_offy = (
            20 + constants.TEXT_SIZES[0] + 4*constants.COLOR_CHART_SIDE*constants.RADIUS
        );
        drawColorChart(color_chart_offx, color_chart_offy);

        constants.COLOR_CHART_X = (
            this.true_x + tx + constants.BUBBLE_WIDTH - color_chart_offx
        );
        constants.COLOR_CHART_Y = (
            this.true_y + ty + constants.BUBBLE_HEIGHT - color_chart_offy
        );
        constants.COLOR_CHART_LINKED = this;

        translate(- (this.true_x + tx), - (this.true_y + ty) );
    }
}
