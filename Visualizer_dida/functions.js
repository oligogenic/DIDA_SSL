function color_from_array(array) {
    return color(array[0], array[1], array[2], array[3]);
}

function distance(x, y, a, b) {
    return Math.sqrt( Math.pow(x - a, 2) + Math.pow(y - b, 2) );
}

function pointInRect(x, y, corx, cory, w, h) {
    return (
        x >= corx && x <= corx + w &&
        y >= cory && y <= cory + h
    );
}

function pointInCircle(x, y, cenx, ceny, r) {
    return distance(x, y, cenx, ceny) <= r;
}

function drawGrid() {

    strokeWeight(1);
    stroke(color_from_array(constants.COLOR_CO));
    // Vertical
    const offset_w = constants.WIDTH / constants.SQUARES_W;
    for (let i = 1; i < constants.SQUARES_W; ++i) {
        const x = i * offset_w;
        let spacing = constants.SPACING, _fill = true;
        for (let y = 1; y < constants.HEIGHT; ++y) {
            if (_fill) point(x, y);
            spacing -= 1;
            if (spacing <= 0) {
                spacing = constants.SPACING;
                _fill = !_fill;
            }
        }
    }

    // Horizontal
    const offset_h = constants.HEIGHT / constants.SQUARES_H;
    for (let i = 1; i < constants.SQUARES_H; ++i) {
        const y = i * offset_h;
        let spacing = constants.SPACING, _fill = true;
        for (let x = 1; x < constants.WIDTH; ++x) {
            if (_fill) point(x, y);
            spacing -= 1;
            if (spacing <= 0) {
                spacing = constants.SPACING;
                _fill = !_fill;
            }
        }
    }
}

function drawLegend() {

    translate(10, 10);

    stroke(color_from_array(constants.COLOR_CO));
    strokeWeight(2);
    fill(255);

    rect(0, 0, constants.LEGEND_WIDTH, constants.LEGEND_HEIGHT);

    strokeWeight(1);
    stroke(color_from_array(constants.COLOR_CO_D));
    fill(color_from_array(constants.COLOR_CO_D));
    textSize(constants.TEXT_SIZES[0]);

    // Title
    let offset_y = 5 + constants.TEXT_SIZES[0];
    text("Digenic effect", 10, offset_y)
    tint(255, 127);
    image(constants.IMAGES.HELP_BUTTON,
        constants.LEGEND_WIDTH - 5 - constants.TEXT_SIZES[0],
        offset_y - 12,
        constants.TEXT_SIZES[0], constants.TEXT_SIZES[0]
    );
    tint(255, 255);

    // TD
    offset_y += 2*constants.TEXT_SIZES[0];
    textSize(constants.TEXT_SIZES[1]);
    text("True digenic", 30, offset_y)

    if (constants.TD_DISABLED) {
        stroke(constants.COLOR_UK_L);
        noFill();
    } else {
        stroke(color_from_array(constants.COLOR_TD));
        fill(color_from_array(constants.COLOR_TD));
    }
    ellipse(
        20,
        offset_y - constants.RADIUS,
        2*constants.RADIUS,
        2*constants.RADIUS
    );

    // Co

    stroke(color_from_array(constants.COLOR_CO_D));
    fill(color_from_array(constants.COLOR_CO_D));

    offset_y += constants.TEXT_SIZES[0];
    textSize(constants.TEXT_SIZES[1]);
    text("Composite", 30, offset_y)

    if (constants.CO_DISABLED) {
        stroke(constants.COLOR_UK_L);
        noFill();
    } else {
        stroke(color_from_array(constants.COLOR_CO));
        fill(color_from_array(constants.COLOR_CO));
    }
    ellipse(
        20,
        offset_y - constants.RADIUS,
        2*constants.RADIUS,
        2*constants.RADIUS
    );

    // Uk

    stroke(color_from_array(constants.COLOR_CO_D));
    fill(color_from_array(constants.COLOR_CO_D));

    offset_y += constants.TEXT_SIZES[0];
    textSize(constants.TEXT_SIZES[1]);
    text("Unknown effect", 30, offset_y)

    if (constants.UK_DISABLED) {
        stroke(constants.COLOR_UK_L);
        noFill();
    } else {
        stroke(color_from_array(constants.COLOR_UK));
        fill(color_from_array(constants.COLOR_UK));
    }
    ellipse(
        20,
        offset_y - constants.RADIUS,
        2*constants.RADIUS,
        2*constants.RADIUS
    );


    translate(-10, -10);
}

function drawFeaturesPanel() {

    translate(constants.WIDTH - 10 - constants.LEGEND_F_WIDTH, 10);

    stroke(color_from_array(constants.COLOR_CO));
    strokeWeight(2);
    fill(255);

    rect(0, 0, constants.LEGEND_F_WIDTH, constants.LEGEND_F_HEIGHT);

    strokeWeight(1);
    stroke(color_from_array(constants.COLOR_CO_D));
    fill(color_from_array(constants.COLOR_CO_D));
    textSize(constants.TEXT_SIZES[0]);

    // Title
    let offset_y = 5 + constants.TEXT_SIZES[0];
    text("Features", 10, offset_y)
    offset_y += constants.TEXT_SIZES[0];

    for (let i = 0; i < constants.FEATURES_AMOUNT; ++i) {

        stroke(color_from_array(constants.COLOR_CO_D));
        fill(color_from_array(constants.COLOR_CO_D));

        // TD
        offset_y += 1.2*constants.TEXT_SIZES[0];
        textSize(constants.TEXT_SIZES[1]);
        text(constants.FEATURES_NAMES[i], 30, offset_y)

        if (!+data_manager.key.tab[i]) {
            stroke(constants.COLOR_UK_L);
            noFill();
        } else {
            stroke(color_from_array(constants.COLOR_UK));
            fill(color_from_array(constants.COLOR_UK));
        }
        ellipse(
            20,
            offset_y - constants.RADIUS,
            2*constants.RADIUS,
            2*constants.RADIUS
        );
    }

    translate(- (constants.WIDTH - 10 - constants.LEGEND_F_WIDTH), -10);
}

function updateHelp() {
    if (constants.HELP_SHOWN) {
        constants.HELP_ALPHA = Math.min(
            255,
            constants.HELP_ALPHA + constants.HELP_SPEED
        );
    } else {
        constants.HELP_ALPHA = Math.max(
            0,
            constants.HELP_ALPHA - constants.HELP_SPEED
        );
    }

    if (!constants.HELP_ALPHA) return;
    tint(255, constants.HELP_ALPHA);
    image(
        constants.IMAGES.HELP_WINDOW,
        0,
        0,
        constants.WIDTH + 2,
        constants.HEIGHT + 2
    );
    tint(255, 255);
}

function get_scale(x, min, max, coef) {
    return (x - min) / (max - min) * coef;
}

function drawColorChart(offset_x, offset_y) {
    translate(
        constants.BUBBLE_WIDTH  - offset_x,
        constants.BUBBLE_HEIGHT - offset_y
    );

    stroke(125);
    let counter = 0;
    for (let color in colors) {
        const x = constants.COLOR_CHART_SIDE * constants.RADIUS * (counter % 4);
        const y = constants.COLOR_CHART_SIDE * constants.RADIUS * parseInt(counter / 4);
        fill(colors[color]);
        rect(
            x,
            y,
            constants.RADIUS*constants.COLOR_CHART_SIDE,
            constants.RADIUS*constants.COLOR_CHART_SIDE
        );
        counter += 1;
    }

    translate(
        offset_x - constants.BUBBLE_WIDTH,
        offset_y - constants.BUBBLE_HEIGHT
    );
}

function arraysEqual(a1, a2) {
    if (!a1 instanceof Array) return !a2 instanceof Array;
    for (let i=0; i < a1.length; ++i) {
        if (a1[i] != a2[i]) return false;
    }
    return true;
}

function binarize_rec(n) {
    return (n == 0) ? '0' : (n == 1) ? '1' : binarize_rec(parseInt(n / 2)) + binarize_rec(n % 2);
}

function binarize(n) {
    const bin = binarize_rec(n);
    return '0'.repeat(constants.FEATURES_AMOUNT - bin.length) + bin;
}


function zeros(n) {
    if (typeof(n) === 'undefined' || isNaN(n)) { return []; }
    if (typeof ArrayBuffer === 'undefined') {
        // lacking browser support
        const arr = new Array(n);
        for (let i = 0; i < n; i++) { arr[i] = 0; }
        return arr;
    } else {
        return new Float64Array(n); // typed arrays are faster
    }
};
