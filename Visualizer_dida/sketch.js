let data_str;

const data = [];
const circle = new Circle();
const searcher = new Searcher();

function preload() {
    data_str = loadStrings("Data/dida_v2_tsne.csv");
}

function setup() {

    frameRate(30);

    // Csv to Json
    const attributes = data_str[0].split(',');
    for (let values of data_str.map(x => x.split(','))) {
        const current_obj = {}
        for (let i=0; i<attributes.length; ++i) {
            current_obj[attributes[i]] = values[i];
        }
        data.push(new Sample(current_obj));
    }

    //Removes header
    data.shift();

    // Initialize search system
    searcher.feed(data);

    // Canvas setup
    createCanvas(constants.WIDTH + 1, constants.HEIGHT + 1);
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

}

function mouseMoved() {
    data.map( sample => {
        sample.toggleActive(distance(mouseX, mouseY, sample.true_x, sample.true_y) <= constants.ACTIVATION_DIST);
        sample.toggleName(false);
    });

    const samples_hovered = data.filter( sample =>
        distance(mouseX, mouseY, sample.true_x, sample.true_y) <= constants.RADIUS
    );
    if (samples_hovered.length) {
        cursor(HAND);
        samples_hovered.sort( sample =>
            distance(mouseX, mouseY, sample.true_x, sample.true_y)
        )[0].toggleName(true);
    } else {
        cursor(ARROW);
    }

    if (searcher.onto(mouseX, mouseY)) cursor(TEXT);

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
}

function mouseClicked() {
    data.map(s => s.toggleBubble(false));
    const close_samples = data.filter( sample =>
        distance(mouseX, mouseY, sample.true_x, sample.true_y) <= constants.RADIUS
    ).sort( sample => distance(mouseX, mouseY, sample.true_x, sample.true_y) );
    if (close_samples.length > 0) {
        close_samples[0].toggleBubble(true);
    }

    if (searcher.onto(mouseX, mouseY)) searcher.toggle(true);
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
}

function mouseDragged() {
    if (mouseX >= constants.WIDTH - 60 && mouseX <= constants.WIDTH - 40 &&
        mouseY >= constants.HEIGHT - 150 && mouseY <= constants.HEIGHT - 50) {

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
}

// Ctrl + V

document.addEventListener('paste', function (event) {
  const clipText = event.clipboardData.getData('Text');
  for (let i = 0; i < clipText.length; ++i) {
      searcher.sendKey(clipText[i]);
  }
});
