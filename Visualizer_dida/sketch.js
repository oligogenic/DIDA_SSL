const data_manager = new DataManager();
const circle = new Circle();
const searcher = new Searcher();

function preload() {
    data_manager.feed(constants.FEATURES_FILE);
}

function setup() {

    frameRate(30);

    // Initialize engines
    data_manager.initialize();
    searcher.feed(data_manager.data);

    // Canvas setup
    createCanvas(constants.WIDTH + 1, constants.HEIGHT + 1);

    // Imgs loading
    for (let key in constants.IMAGES) {
        constants.IMAGES[key] = loadImage(
            constants.IMAGES_PATH + constants.IMAGES[key]
        );
    }
}

function draw() {
    fill(255);
    strokeWeight(4);
    stroke(color_from_array(constants.COLOR_TEXT));
    rect(0, 0, constants.WIDTH, constants.HEIGHT);

    drawGrid();


    noStroke();
    fill(color_from_array(constants.ACTIVATION_COLOR));
    ellipse(
        mouseX,
        mouseY,
        constants.ACTIVATION_DIST*2,
        constants.ACTIVATION_DIST*2
    );

    // We draw normal samples before
    data_manager.data.map( sample => {
        sample.update();
        sample.draw(data_manager.data.some(sample => sample.highlighted));
    });

    // Then we draw only custom ones
    data_manager.data.filter( sample =>
        sample.custom_color
    ).map( sample => {
        sample.update();
        sample.draw(data_manager.data.some(sample => sample.highlighted));
    });

    // Legend

    drawLegend();
    drawFeaturesPanel();

    // Circle

    circle.update(data_manager.data.filter(sample => sample.active));
    circle.updateBubble();
    circle.draw();

    data_manager.data.map( sample => {
        sample.drawName();
    });

    data_manager.data.map( sample => {
        sample.updateBubble();
        sample.drawBubble();
    });

    // Slider

    drawSlider();
    // Searcher

    searcher.draw();

    // Check if user wants to remove a character

    if (keyIsDown(BACKSPACE)) searcher.removeLastChar();
    else searcher.resetRemoveDelay();
}

function mouseMoved() {
    // We activate samples in selection radius (blobbing effect)
    data_manager.data.map( sample => {
        sample.toggleActive(
            pointInCircle(
                sample.true_x,
                sample.true_y,
                mouseX,
                mouseY,
                constants.ACTIVATION_DIST
            )
        );
        sample.toggleName(false);
    });

    // Searcher detection
    if (searcher.onto(mouseX, mouseY)) {
        cursor(TEXT);
        return;
    }

    // Legend dots
    if (mouseX >= 30 - constants.RADIUS && mouseX <= 30 + constants.RADIUS) {
        let offset_y = 15 + 3*constants.TEXT_SIZES[0];
        for (let i = 0; i < 4; ++i) {
            if ( mouseY >= offset_y - 2*constants.RADIUS && mouseY <= offset_y ) {
                cursor(HAND);
                return;
            }
            offset_y += constants.TEXT_SIZES[0];
        }
    }

    // Features panel dots
    const translation_x = constants.WIDTH + 10 - constants.LEGEND_F_WIDTH;
    if (
        mouseX >= translation_x - constants.RADIUS &&
        mouseX <= translation_x + constants.RADIUS)
    {
        let offset_y = 15 + 3*constants.TEXT_SIZES[0];
        for (let i = 0; i < constants.FEATURES_AMOUNT; ++i) {
            if ( mouseY >= offset_y - 2*constants.RADIUS && mouseY <= offset_y ) {
                cursor(HAND);
                return;
            }
            offset_y += 1.2*constants.TEXT_SIZES[0];
        }
    }

    // Slider
    if (pointInRect(
        mouseX,
        mouseY,
        constants.WIDTH - 55,
        constants.HEIGHT - 150,
        10,
        100)) {
            cursor(HAND);
            return;
    }

    // Help button
    if (pointInCircle(
        mouseX,
        mouseY,
        constants.LEGEND_WIDTH + 5 - constants.TEXT_SIZES[0] / 2,
        18 + constants.TEXT_SIZES[0] / 2,
        constants.TEXT_SIZES[0]/2, constants.TEXT_SIZES[0]/2
    )) {
        cursor(HAND);
        return;
    }

    // Color chart
    if (constants.COLOR_CHART_LINKED && pointInRect(
        mouseX,
        mouseY,
        constants.COLOR_CHART_X,
        constants.COLOR_CHART_Y,
        constants.COLOR_CHART_SIDE*constants.RADIUS*8,
        constants.COLOR_CHART_SIDE*constants.RADIUS*8
    )) {
        cursor(HAND);
        return;
    }

    // We gather which samples are hovered
    const samples_hovered = data_manager.data.filter( sample =>
        pointInCircle(
            sample.true_x,
            sample.true_y,
            mouseX,
            mouseY,
            constants.RADIUS
        ) && !sample.isDisabled()
    );

    if (samples_hovered.length) {
        cursor(HAND);
        samples_hovered.sort( sample =>
            distance(mouseX, mouseY, sample.true_x, sample.true_y)
        )[0].toggleName(true);
        return;
    } else {
        cursor(ARROW);
    }
}

function mouseClicked() {

    // Color chart
    if (constants.COLOR_CHART_LINKED && pointInRect(
        mouseX,
        mouseY,
        constants.COLOR_CHART_X,
        constants.COLOR_CHART_Y,
        constants.COLOR_CHART_SIDE*constants.RADIUS*8,
        constants.COLOR_CHART_SIDE*constants.RADIUS*8
    )) {
        const relative_x = parseInt(
            (mouseX - constants.COLOR_CHART_X) /
            (constants.COLOR_CHART_SIDE*constants.RADIUS)
        );
        const relative_y = parseInt(
            (mouseY - constants.COLOR_CHART_Y) /
            (constants.COLOR_CHART_SIDE*constants.RADIUS)
        );
        const newColor = Object.values(colors)[4*relative_y + relative_x];
        constants.COLOR_CHART_LINKED.setColor(newColor);
        return;
    }

    data_manager.data.map(s => s.toggleBubble(false));
    const close_samples = data_manager.data.filter( sample =>
        pointInCircle(
            sample.true_x,
            sample.true_y,
            mouseX,
            mouseY,
            constants.RADIUS
        ) && !sample.isDisabled()
    ).sort(sample => distance(mouseX, mouseY, sample.true_x, sample.true_y));

    if (close_samples.length > 0) {
        close_samples[0].toggleBubble(true);
        return;
    }

    if (
        searcher.onto(mouseX, mouseY) ||
        close_samples.length && close_samples[0].highlighted
    ) {
        searcher.toggle(true);
        return;
    }
    else searcher.toggle(false);

    // Legend clicking
    if (mouseX >= 30 - constants.RADIUS && mouseX <= 30 + constants.RADIUS) {
        let offset_y = 15 + 3*constants.TEXT_SIZES[0];
        if ( mouseY >= offset_y - 2*constants.RADIUS && mouseY <= offset_y ) {
            constants.UK_DISABLED = !constants.UK_DISABLED;
            return;
        }
        offset_y += constants.TEXT_SIZES[0];
        if ( mouseY >= offset_y - 2*constants.RADIUS && mouseY <= offset_y ) {
            constants.TD_DISABLED = !constants.TD_DISABLED;
            return;
        }
        offset_y += constants.TEXT_SIZES[0];
        if ( mouseY >= offset_y - 2*constants.RADIUS && mouseY <= offset_y ) {
            constants.CO_DISABLED = !constants.CO_DISABLED;
            return;
        }
        offset_y += constants.TEXT_SIZES[0];
        if ( mouseY >= offset_y - 2*constants.RADIUS && mouseY <= offset_y ) {
            constants.DD_DISABLED = !constants.DD_DISABLED;
            return;
        }
    }

    // Features panel dots
    const translation_x = constants.WIDTH + 10 - constants.LEGEND_F_WIDTH;
    if (
        mouseX >= translation_x - constants.RADIUS &&
        mouseX <= translation_x + constants.RADIUS)
    {
        let offset_y = 15 + 3*constants.TEXT_SIZES[0];
        for (let i = 0; i < constants.FEATURES_AMOUNT; ++i) {
            if ( mouseY >= offset_y - 2*constants.RADIUS && mouseY <= offset_y ) {
                data_manager.changeKey(i);
                return;
            }
            offset_y += 1.2*constants.TEXT_SIZES[0];
        }
    }

    // Slider clicked
    if (pointInRect(
        mouseX, mouseY,
        constants.WIDTH - 55, constants.HEIGHT - 150,
        10, 100)) {

        constants.ACTIVATION_DIST = Math.min(
            constants.ACTIVATION_DIST_MAX,
            Math.max(
                constants.ACTIVATION_DIST_MIN,
                (
                    (constants.HEIGHT - 50 - mouseY) /
                    100 *
                    (
                        constants.ACTIVATION_DIST_MAX -
                        constants.ACTIVATION_DIST_MIN
                    ) + constants.ACTIVATION_DIST_MIN
                )
            )
        );
        return;
    }

    // Help button clicked
    constants.HELP_SHOWN = pointInCircle(
        mouseX,
        mouseY,
        constants.LEGEND_WIDTH + 5 - constants.TEXT_SIZES[0] / 2,
        18 + constants.TEXT_SIZES[0] / 2,
        constants.TEXT_SIZES[0]/2, constants.TEXT_SIZES[0]/2
    );
}

function mouseDragged() {
    // Slider dragged
    if (pointInRect(
        mouseX, mouseY,
        constants.WIDTH - 60, constants.HEIGHT - 150,
        20, 100)) {

        constants.ACTIVATION_DIST = Math.min(
            constants.ACTIVATION_DIST_MAX,
            Math.max(
                constants.ACTIVATION_DIST_MIN,
                (
                    (constants.HEIGHT - 50 - mouseY) /
                    100 * (
                        constants.ACTIVATION_DIST_MAX -
                        constants.ACTIVATION_DIST_MIN
                    ) + constants.ACTIVATION_DIST_MIN
                )
            )
        );
    }
}

function keyTyped() {
    searcher.sendKey(key);
}

function keyPressed() {
    if (keyCode == TAB) searcher.validateSuggestion();
}

// Ctrl + V

document.addEventListener('paste', function (event) {
  const clipText = event.clipboardData.getData('Text');
  for (let i = 0; i < clipText.length; ++i) {
      searcher.sendKey(clipText[i]);
  }
});
