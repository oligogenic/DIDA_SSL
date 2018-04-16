class Circle {

    constructor() {
        this.x = 0;
        this.y = 0;
        this.dest_x = 0;
        this.dest_y = 0;

        this.radius = 0;
        this.maxRadius = 0;

        this.shown = false;

        // RecA, EssA, RecB, EssB, Path, coexp, allst, TD, CO, UK
        this.means = [];
        this.stds  = [];

        this.samplesCount = 0;

        this.bubble_width = 0;
        this.bubble_height = 0;
        this.bubble_width_t = 0;
        this.bubble_height_t = 0;

        this.rotation = 0;
        this.precision = 0;
        this.rotation_speed = 0;
    }

    update(samples) { // Samples must be active

        samples = samples.filter(sample => !sample.isDisabled());

        if (samples.length == 0 && this.maxRadius == 0 && this.radius == 0) {
            this.x = mouseX;
            this.y = mouseY;
            return;
        }

        if (samples.length == 0) {
            this.maxRadius = 0;
        } else {
            let x_sum = 0, y_sum = 0;
            for (let sample of samples) {
                x_sum += sample.true_x;
                y_sum += sample.true_y;
            }
            this.dest_x = x_sum / samples.length;
            this.dest_y = y_sum / samples.length;
            this.maxRadius = Math.max(...samples.map(sample =>
                 distance(this.dest_x, this.dest_y, sample.true_x, sample.true_y)
            )) + 2*constants.RADIUS;
        }

        // Radius goal
        if (this.radius < this.maxRadius) {
            this.shown = true;
            this.radius += (1 + this.radius * 0.1);
            if (this.radius > this.maxRadius) this.radius = this.maxRadius;
        } else if (this.radius <= 0) {
            this.shown = false;
            this.radius = 0;
        } else if (this.radius > this.maxRadius) {
            this.shown = true;
            this.radius -= (1 + this.radius * 0.1);
            if (this.radius < this.maxRadius) this.radius = this.maxRadius;
        }

        // Position goal
        if (this.x != this.dest_x || this.y != this.dest_y) {
            const dx = this.dest_x - this.x;
            const dy = this.dest_y - this.y;
            const norm = distance(0, 0, dx, dy);
            const speed = Math.max(constants.MIN_SPEED, norm / 10);
            this.x += dx / norm * speed;
            this.y += dy / norm * speed;

            const dx2 = this.dest_x - this.x;
            const dy2 = this.dest_y - this.y;
            if (dx * dx2 <= 0) this.x = this.dest_x;
            if (dy * dy2 <= 0) this.y = this.dest_y;
        }

        this.means = zeros(15);
        samples.map( sample => {
            for (let i = 0; i < sample.features_tab.length; ++i)
                this.means[i] += sample.features_tab[i];

            this.means[12] += (sample.DE == "TD");
            this.means[13] += (sample.DE == "CO");
            this.means[14] += (sample.DE == "UK");
        });
        this.samplesCount = this.means[12] + this.means[13] + this.means[14];
        this.means = this.means.map(x => x/this.samplesCount);

        // RecA, EssA, RecB, EssB, Path, coexp, allst
        this.stds = zeros(12);
        samples.map( sample => {
            for (let i = 0; i < sample.features_tab.length; ++i)
                this.stds[i] += Math.pow(parseFloat(sample.features_tab[i]) - this.means[i], 2);
        });
        this.stds = this.stds.map(x => Math.sqrt(x/this.samplesCount));

        // Bubble update

        if (this.stand_still()) {
            this.bubble_width_t = constants.BUBBLE_CIRCLE_WIDTH;
            this.bubble_height_t = constants.BUBBLE_CIRCLE_HEIGHT;
        } else {
            this.bubble_width_t = 0;
            this.bubble_height_t = 0;
        }
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

    stand_still() {
        return (
            this.x == this.dest_x &&
            this.y == this.dest_y &&
            this.radius == this.maxRadius
        )
    }

    draw() {

        if (
            !this.shown ||
            this.maxRadius == 0 && this.radius == 0 ||
            constants.ACTIVATION_DIST < 5
        ) return;

        // Circle drawing

        strokeWeight(4);
        stroke(color_from_array(constants.COLOR_CO));
        noFill();

        translate(this.x, this.y);
        rotate(this.rotation);

        this.precision = this.radius * constants.CIRCLE_DENSITY;
        const step = 2 * Math.PI / (1 + parseInt(this.precision));
        this.rotation_speed = 1 / (1 + this.radius);
        for (let i=0; i < 2*Math.PI - 1e-6; i += step) {
            const x = this.radius * Math.cos(i);
            const y = this.radius * Math.sin(i);
            point(x, y);
        }
        rotate(-this.rotation);
        translate(-this.x, -this.y);


        this.rotation += this.rotation_speed;
        if (this.rotation >= Math.PI*2) this.rotation -= Math.PI*2;

        // If circle is not finished, we return
        if (!this.stand_still()) return;


        // We show bubble
        const tx = ( (this.x < constants.WIDTH / 2) ?
            Math.min(constants.BUBBLE_CIRCLE_MAXDIST, this.radius) :
            Math.max(
                -constants.BUBBLE_CIRCLE_MAXDIST - this.bubble_width,
                - this.radius - this.bubble_width
            )
        );
        const ty = ( (this.y < constants.HEIGHT / 2) ?
            Math.min(constants.BUBBLE_CIRCLE_MAXDIST, this.radius) :
            Math.max(
                -constants.BUBBLE_CIRCLE_MAXDIST - this.bubble_height,
                - this.radius - this.bubble_height
            )
        );

        translate(this.x + tx, this.y + ty);

        stroke(color_from_array(constants.COLOR_CO_D));
        fill(255);
        rect(0, 0, this.bubble_width, this.bubble_height);

        translate(- (this.x + tx), - (this.y + ty) );

        // Bubble is not finished, we return
        if (
            this.bubble_height != this.bubble_height_t ||
            this.bubble_width != this.bubble_width_t
        ) return;


        // Text writing

        translate(this.x + tx, this.y + ty);

        strokeWeight(1);
        noFill();
        textSize(constants.TEXT_SIZES[2]);

        let offset_y = 15;
        for (let i = 0; i < this.stds.length; ++i) {
            if (!+data_manager.key.tab[i]) continue;
            const meanround = Math.round(this.means[i] * 100) / 100;
            text(constants.FEATURES_TEXTS_S[i] + " (mean):", 5, offset_y);
            text(
                meanround,
                constants.BUBBLE_CIRCLE_WIDTH - textWidth(meanround) - 5,
                offset_y
            );

            offset_y += constants.TEXT_SIZES[2];
            const stdround = Math.round(this.stds[i] * 100) / 100;
            text(constants.FEATURES_TEXTS_S[i] + " (std):", 5, offset_y);
            text(
                stdround,
                constants.BUBBLE_CIRCLE_WIDTH - textWidth(stdround) - 5,
                offset_y
            );
            offset_y += constants.TEXT_SIZES[2];
        }

        // DE

        const de_meanround = [
            Math.round(this.means[12] * 1000) / 1000, // TD
            Math.round(this.means[13] * 1000) / 1000, // CO
            Math.round(this.means[14] * 1000) / 1000 // UK
        ]

        const de_meanround_str = (
            'TD: ' + de_meanround[0] +
            ', CO: ' + de_meanround[1] +
            ', UK: ' + de_meanround[2] +
            ', ' + this.samplesCount + ' pairs.'
        );
        text(de_meanround_str, 5, offset_y);

        translate(- (this.x + tx), - (this.y + ty) );
    }
}
