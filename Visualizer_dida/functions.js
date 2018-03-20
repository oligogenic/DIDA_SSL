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
    ellipse(20, offset_y - constants.RADIUS, 2*constants.RADIUS, 2*constants.RADIUS);

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
    ellipse(20, offset_y - constants.RADIUS, 2*constants.RADIUS, 2*constants.RADIUS);

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
    ellipse(20, offset_y - constants.RADIUS, 2*constants.RADIUS, 2*constants.RADIUS);


    translate(-10, -10);
}

function updateHelp() {
    if (constants.HELP_SHOWN) {
        constants.HELP_ALPHA = Math.min(255, constants.HELP_ALPHA + constants.HELP_SPEED);
    } else {
        constants.HELP_ALPHA = Math.max(0, constants.HELP_ALPHA - constants.HELP_SPEED);
    }

    if (!constants.HELP_ALPHA) return;
    tint(255, constants.HELP_ALPHA);
    image(constants.IMAGES.HELP_WINDOW, 0, 0, constants.WIDTH + 2, constants.HEIGHT + 2);
    tint(255, 255);
}
