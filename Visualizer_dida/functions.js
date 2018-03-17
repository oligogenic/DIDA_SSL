function color_from_array(array) {
    return color(array[0], array[1], array[2], array[3]);
}

function distance(x, y, a, b) {
    return Math.sqrt( Math.pow(x - a, 2) + Math.pow(y - b, 2) );
}
