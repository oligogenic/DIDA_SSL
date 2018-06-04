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
    stroke(color_from_array(constants.COLOR_TEXT));
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

    stroke(color_from_array(constants.COLOR_TEXT));
    strokeWeight(2);
    fill(255);

    rect(0, 0, constants.LEGEND_WIDTH, constants.LEGEND_HEIGHT);

    strokeWeight(1);
    stroke(color_from_array(constants.COLOR_TEXT));
    fill(color_from_array(constants.COLOR_TEXT));
    textSize(constants.TEXT_SIZES[0]);

    // Title
    let offset_y = 5 + constants.TEXT_SIZES[0];
    text("Digenic effect", 10, offset_y)

    offset_y += constants.TEXT_SIZES[0];

    const texts = ["Unknown", "True digenic", "Modifier", "Dual molecular\ndiagnosis"];
    const colors = [constants.COLOR_UK, constants.COLOR_TD, constants.COLOR_CO, constants.COLOR_DD];
    const deactivated = [constants.UK_DISABLED, constants.TD_DISABLED, constants.CO_DISABLED, constants.DD_DISABLED];

    constants.LEGEND_DOT_SIZE += constants.LEGEND_DOT_GRAD;
    if (
        constants.LEGEND_DOT_SIZE > constants.MAX_RADIUS ||
        constants.LEGEND_DOT_SIZE < constants.MIN_RADIUS
    ) {
        constants.LEGEND_DOT_GRAD *= -1;
    }

    for (let i=0; i < 4; ++i) {
        stroke(color_from_array(constants.COLOR_TEXT));
        fill(color_from_array(constants.COLOR_TEXT));

        offset_y += constants.TEXT_SIZES[0];
        textSize(constants.TEXT_SIZES[1]);
        text(texts[i], 30, offset_y)

        let size = 0;
        if (deactivated[i]) {
            stroke(constants.COLOR_UK_D);
            strokeWeight(2);
            noFill();
            size = constants.RADIUS;
        } else {
            stroke(color_from_array(colors[i]));
            fill(color_from_array(colors[i]));
            strokeWeight(1);
            size = constants.LEGEND_DOT_SIZE;
        }
        ellipse(
            20,
            offset_y - constants.RADIUS,
            2*size
        );
        strokeWeight(1);
    }

    offset_y += 40;

    strokeWeight(1);
    textSize(15);
    stroke(100);
    fill(100);
    textStyle(ITALIC);
    textAlign(CENTER);
    text(constants.CLASS_PANEL_TEXT, constants.LEGEND_WIDTH/2, offset_y)
    textAlign(LEFT);
    textStyle(NORMAL);

    translate(-10, -10);
}

function drawFeaturesPanel() {

    translate(constants.WIDTH - 10 - constants.LEGEND_F_WIDTH, 10);

    stroke(color_from_array(constants.COLOR_TEXT));
    strokeWeight(2);
    fill(255);

    rect(0, 0, constants.LEGEND_F_WIDTH, constants.LEGEND_F_HEIGHT);

    strokeWeight(1);
    stroke(color_from_array(constants.COLOR_TEXT));
    fill(color_from_array(constants.COLOR_TEXT));
    textSize(constants.TEXT_SIZES[0]);

    // Title
    let offset_y = 5 + constants.TEXT_SIZES[0];
    text("Features", 10, offset_y)
    offset_y += constants.TEXT_SIZES[0];

    for (let i = 0; i < constants.FEATURES_AMOUNT; ++i) {

        stroke(color_from_array(constants.COLOR_TEXT));
        fill(color_from_array(constants.COLOR_TEXT));

        offset_y += 1.2*constants.TEXT_SIZES[0];
        textSize(constants.TEXT_SIZES[1]);
        text(constants.FEATURES_NAMES[i], 30, offset_y)

        let size = 0;
        if (!+data_manager.key.tab[i]) {
            stroke(constants.COLOR_UK_L);
            noFill();
            size = constants.RADIUS;
        } else {
            stroke(color_from_array(constants.COLOR_UK));
            fill(color_from_array(constants.COLOR_UK));
            size = constants.LEGEND_DOT_SIZE;
        }
        ellipse(
            20,
            offset_y - constants.RADIUS,
            2*size
        );
    }

    offset_y += 30;

    strokeWeight(1);
    textSize(15);
    stroke(100);
    fill(100);
    textStyle(ITALIC);
    textAlign(CENTER);
    text(constants.FEATURE_PANEL_TEXT, constants.LEGEND_F_WIDTH/2, offset_y)
    textAlign(LEFT);
    textStyle(NORMAL);

    translate(- (constants.WIDTH - 10 - constants.LEGEND_F_WIDTH), -10);
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
function drawSlider() {
    strokeWeight(4);
    stroke(color_from_array(constants.COLOR_UK));
    line(
        constants.WIDTH - 50,
        constants.HEIGHT - 50,
        constants.WIDTH - 50,
        constants.HEIGHT - 150
    );

    strokeWeight(8);
    stroke(30);

    const ratio = (
        constants.ACTIVATION_DIST - constants.ACTIVATION_DIST_MIN
    ) / (
        constants.ACTIVATION_DIST_MAX - constants.ACTIVATION_DIST_MIN
    );
    line(
        constants.WIDTH - 60,
        constants.HEIGHT - 50 - ratio*100,
        constants.WIDTH - 40,
        constants.HEIGHT - 50 - ratio*100
    );

    strokeWeight(1);
    textSize(15);
    stroke(100);
    fill(100);
    textStyle(ITALIC);
    textAlign(CENTER);
    text(constants.SLIDER_TEXT, constants.WIDTH - 50, constants.HEIGHT - 30)
    textAlign(LEFT);
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
