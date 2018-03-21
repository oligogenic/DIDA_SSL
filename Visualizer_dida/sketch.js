let data_str_simple, data_str_coexp, data;

const data_simple = [], data_coexp = [];
const circle = new Circle();
const searcher = new Searcher();

function preload() {
    data_str_simple = loadStrings("Data/dida_v2_tsne.csv");
    data_str_coexp = loadStrings("Data/dida_v2_tsne_coexp.csv");
}

function setup() {

    document.getElementById('defaultCanvas0').addEventListener('keydown', function (e) {
        if (e.which == 9) {
            e.preventDefault();
            return false;
        }
    });

    frameRate(30);

    loadData(data_str_simple, data_simple);
    loadData(data_str_coexp, data_coexp);

    data = data_coexp;
    switchData();

    // Initialize search system
    searcher.feed(data_coexp);

    // Canvas setup
    createCanvas(constants.WIDTH + 1, constants.HEIGHT + 1);

    // Imgs loading
    for (let key in constants.IMAGES) {
        constants.IMAGES[key] = loadImage(constants.IMAGES_PATH + constants.IMAGES[key]);
    }
}

function draw() {
    fill(255);
    strokeWeight(4);
    stroke(color_from_array(constants.COLOR_TD));
    rect(0, 0, constants.WIDTH, constants.HEIGHT);

    drawGrid();


    noStroke();
    fill(color_from_array(constants.ACTIVATION_COLOR));
    ellipse(mouseX, mouseY, constants.ACTIVATION_DIST*2, constants.ACTIVATION_DIST*2);

    data.map( sample => {
        sample.update();
        sample.draw( data.some(sample => sample.highlighted) );
    });

    // Legend

    drawLegend();

    // Circle

    circle.update(data.filter(sample => sample.active));
    circle.updateBubble();
    circle.draw();

    data.map( sample => {
        sample.drawName();
    });

    data.map( sample => {
        sample.updateBubble();
        sample.drawBubble();
    });

    // Slider

    strokeWeight(4);
    stroke(color_from_array(constants.COLOR_UK));
    line(constants.WIDTH - 50, constants.HEIGHT - 50, constants.WIDTH - 50, constants.HEIGHT - 150);

    strokeWeight(8);
    stroke(0);

    const ratio = (constants.ACTIVATION_DIST - constants.ACTIVATION_DIST_MIN) / (constants.ACTIVATION_DIST_MAX - constants.ACTIVATION_DIST_MIN);
    line(constants.WIDTH - 60, constants.HEIGHT - 50 - ratio*100, constants.WIDTH - 40, constants.HEIGHT - 50 - ratio*100);

    // Searcher

    searcher.draw();

    // Check if user wants to remove a character

    if (keyIsDown(BACKSPACE)) searcher.removeLastChar();
    else searcher.resetRemoveDelay();

    // Help drawing

    updateHelp();

}

function mouseMoved() {
    // We activate samples in selection radius (blobbing effect)
    data.map( sample => {
        sample.toggleActive(
            pointInCircle(sample.true_x, sample.true_y, mouseX, mouseY, constants.ACTIVATION_DIST
            )
        );
        sample.toggleName(false);
    });

    // We gather which samples are hovered
    const samples_hovered = data.filter( sample =>
        pointInCircle(sample.true_x, sample.true_y, mouseX, mouseY, constants.RADIUS) &&
        !sample.isDisabled()
    );
    if (samples_hovered.length) {
        cursor(HAND);
        samples_hovered.sort( sample =>
            distance(mouseX, mouseY, sample.true_x, sample.true_y)
        )[0].toggleName(true);
    } else {
        cursor(ARROW);
    }

    // Searcher detection
    if (searcher.onto(mouseX, mouseY)) cursor(TEXT);

    // Legend dots
    if (mouseX >= 30 - constants.RADIUS && mouseX <= 30 + constants.RADIUS) {
        let offset_y = 15 + 3*constants.TEXT_SIZES[0];
        if ( mouseY >= offset_y - 2*constants.RADIUS && mouseY <= offset_y )
            cursor(HAND)
        offset_y += constants.TEXT_SIZES[0];
        if ( mouseY >= offset_y - 2*constants.RADIUS && mouseY <= offset_y )
            cursor(HAND)
        offset_y += constants.TEXT_SIZES[0];
            if ( mouseY >= offset_y - 2*constants.RADIUS && mouseY <= offset_y )
                cursor(HAND)
    }

    // Slider
    if (pointInRect(
        mouseX, mouseY,
        constants.WIDTH - 55, constants.HEIGHT - 150,
        10, 100)) {
        cursor(HAND);
    }

    // Help button
    if (pointInCircle(
        mouseX,
        mouseY,
        constants.LEGEND_WIDTH + 5 - constants.TEXT_SIZES[0] / 2,
        18 + constants.TEXT_SIZES[0] / 2,
        constants.TEXT_SIZES[0]/2, constants.TEXT_SIZES[0]/2
    )) cursor(HAND);
}

function mouseClicked() {
    data.map(s => s.toggleBubble(false));
    const close_samples = data.filter( sample =>
        pointInCircle(sample.true_x, sample.true_y, mouseX, mouseY, constants.RADIUS) &&
        !sample.isDisabled()
    ).sort( sample => distance(mouseX, mouseY, sample.true_x, sample.true_y) );
    if (close_samples.length > 0) {
        close_samples[0].toggleBubble(true);
    }

    if (
        searcher.onto(mouseX, mouseY) ||
        close_samples.length && close_samples[0].highlighted
    ) searcher.toggle(true);
    else searcher.toggle(false);

    if (mouseX >= 30 - constants.RADIUS && mouseX <= 30 + constants.RADIUS) {
        let offset_y = 15 + 3*constants.TEXT_SIZES[0];
        if ( mouseY >= offset_y - 2*constants.RADIUS && mouseY <= offset_y )
            constants.TD_DISABLED = !constants.TD_DISABLED;
        offset_y += constants.TEXT_SIZES[0];
        if ( mouseY >= offset_y - 2*constants.RADIUS && mouseY <= offset_y )
            constants.CO_DISABLED = !constants.CO_DISABLED;
        offset_y += constants.TEXT_SIZES[0];
        if ( mouseY >= offset_y - 2*constants.RADIUS && mouseY <= offset_y )
            constants.UK_DISABLED = !constants.UK_DISABLED;
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
                (constants.HEIGHT - 50 - mouseY) / 100 * (constants.ACTIVATION_DIST_MAX - constants.ACTIVATION_DIST_MIN) + constants.ACTIVATION_DIST_MIN
            )
        );
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
                (constants.HEIGHT - 50 - mouseY) / 100 * (constants.ACTIVATION_DIST_MAX - constants.ACTIVATION_DIST_MIN) + constants.ACTIVATION_DIST_MIN
            )
        );
    }
}

function keyTyped() {
    searcher.sendKey(key);
}

function keyPressed() {
    if (keyCode == TAB) searcher.validateSuggestion();
    if (keyCode == 32 && !searcher.toggled) switchData();
}

// Ctrl + V

document.addEventListener('paste', function (event) {
  const clipText = event.clipboardData.getData('Text');
  for (let i = 0; i < clipText.length; ++i) {
      searcher.sendKey(clipText[i]);
  }
});
