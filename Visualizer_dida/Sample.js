class Sample {
    constructor(obj) {
        for (let key in obj) {
            this[key] = obj[key];
        }
        this.color = (
            (this.DE == 'TD') ? color_from_array(constants.COLOR_TD) :
            (this.DE == 'CO') ? color_from_array(constants.COLOR_CO) :
            color_from_array(constants.COLOR_UK)
        );
        this.color_d = (
            (this.DE == 'TD') ? color_from_array(constants.COLOR_TD_D) :
            (this.DE == 'CO') ? color_from_array(constants.COLOR_CO_D) :
            color_from_array(constants.COLOR_UK_D)
        );
        this.color_l = (
            (this.DE == 'TD') ? color_from_array(constants.COLOR_TD_L) :
            (this.DE == 'CO') ? color_from_array(constants.COLOR_CO_L) :
            color_from_array(constants.COLOR_UK_L)
        );
        this.radius = constants.RADIUS;

        this.active = false;
        this.sense = 0;

        this.true_x = (this.x - constants.MIN_X) / (constants.MAX_X - constants.MIN_X) * constants.WIDTH;
        this.true_y = (this.y - constants.MIN_Y) / (constants.MAX_Y - constants.MIN_Y) * constants.HEIGHT;

        this.dest_x = this.true_x;
        this.dest_y = this.true_y;

        this.bubble_width = 0;
        this.bubble_height = 0;

        this.bubble_width_t = 0;
        this.bubble_height_t = 0;

        this.bubble_modifier_x = (constants.WIDTH - this.true_x <= constants.BUBBLE_WIDTH) ? -1 : 1;
        this.bubble_modifier_y = (constants.HEIGHT - this.true_y <= constants.BUBBLE_HEIGHT) ? -1 : 1;

        this.name_shown = false;

        this.highlighted = false; // If seach engine suggests it
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
    }

    bubbleDisappear() {
        this.bubble_width_t = 0;
        this.bubble_height_t = 0;
    }

    isDisabled() {
        return (
            this.DE == 'UK' && constants.UK_DISABLED ||
            this.DE == 'CO' && constants.CO_DISABLED ||
            this.DE == 'TD' && constants.TD_DISABLED
        );
    }

    update() {

        if (this.true_x != this.dest_x || this.true_y != this.dest_y) {
            const dP = createVector(this.dest_x - this.true_x, this.dest_y - this.true_y);
            const dP_normed = dP.div(constants.SAMPLES_SPEED);
            this.true_x += dP_normed.x;
            this.true_y += dP_normed.y;
            const dP2 = createVector(this.dest_x - this.true_x, this.dest_y - this.true_y);
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
            this.bubble_width = Math.min(this.bubble_width_t, this.bubble_width + constants.BUBBLE_GROWTH_W);
        } else if (dx < 0) {
            this.bubble_width = Math.max(0, this.bubble_width - constants.BUBBLE_GROWTH_W);
        }

        if (dy > 0) {
            this.bubble_height = Math.min(this.bubble_height_t, this.bubble_height + constants.BUBBLE_GROWTH_H);
        } else if (dy < 0) {
            this.bubble_height = Math.max(0, this.bubble_height - constants.BUBBLE_GROWTH_H);
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
        const x_flag = (this.true_x > constants.WIDTH / 2) ? this.true_x - textWidth(this.Name) - 5 : this.true_x + 5;
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

        // Bubble is full, we write the text.
        if (this.bubble_width == this.bubble_width_t) {
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

            // GENE 1

            const gene_names = this.Pair.split('/');

            strokeWeight(1);
            textSize(constants.TEXT_SIZES[1]);
            text(gene_names[0], 3, constants.TEXT_SIZES[1] + offset_y);

            offset_y += constants.TEXT_SIZES[1] + 2;

            textSize(constants.TEXT_SIZES[2]);
            text("Essential (mouse): " + (this.EssA == 1 ? "Yes" : "No"), 3, constants.TEXT_SIZES[2] + offset_y);

            offset_y += constants.TEXT_SIZES[2] + 2;

            textSize(constants.TEXT_SIZES[2]);
            text("Recessiveness: " + Math.round(this.RecA * 100)/100, 3, constants.TEXT_SIZES[2] + offset_y);

            offset_y += constants.TEXT_SIZES[2] + 5;

            // GENE 2

            strokeWeight(1);
            textSize(constants.TEXT_SIZES[1]);
            text(gene_names[1], 3, constants.TEXT_SIZES[1] + offset_y);

            offset_y += constants.TEXT_SIZES[1] + 2;

            textSize(constants.TEXT_SIZES[2]);
            text("Essential (mouse): " + (this.EssB == 1 ? "Yes" : "No"), 3, constants.TEXT_SIZES[2] + offset_y);

            offset_y += constants.TEXT_SIZES[2] + 2;

            textSize(constants.TEXT_SIZES[2]);
            text("Recessiveness: " + Math.round(this.RecB * 100)/100, 3, constants.TEXT_SIZES[2] + offset_y);

            offset_y += constants.TEXT_SIZES[2] + 10;

            // Pathway

            textSize(constants.TEXT_SIZES[2]);
            text("Pathway related: " + (this.Path == 1 ? "Yes" : "No"), 3, constants.TEXT_SIZES[2] + offset_y);

            // Digenic combination

            strokeWeight(1.5);
            textSize(constants.TEXT_SIZES[0]);
            text(this.DidaID, constants.BUBBLE_WIDTH - textWidth(this.DidaID) - 5, constants.BUBBLE_HEIGHT - 5);

            // Digenic effect
            text(this.DE, constants.BUBBLE_WIDTH - textWidth(this.DE) - 5, constants.BUBBLE_HEIGHT - 5 - constants.TEXT_SIZES[0]);

            translate(- (this.true_x + tx), - (this.true_y + ty) );
        }
    }
}
