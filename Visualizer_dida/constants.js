const constants = {
    HEIGHT: 600,
    WIDTH: 900,
    SQUARES_W: 6,
    SQUARES_H: 4,
    SPACING: 13, // Grid dashed line spacing

    RADIUS: 4,
    MIN_RADIUS: 3,
    MAX_RADIUS: 5,
    SAMPLE_GROWTH_RATE: 0.15,

    MIN_X: -0.1,
    MAX_X: 1.25,
    MIN_Y: -0.1,
    MAX_Y: 1.2,

    // Normal
    COLOR_CO: [51, 153, 255, 130],
    COLOR_TD: [255, 0, 0, 130],
    COLOR_UK: [100, 100, 100, 130],

    // Dark
    COLOR_CO_D: [25, 75, 160, 200],
    COLOR_TD_D: [127, 0, 0, 200],
    COLOR_UK_D: [50, 50, 50, 200],

    // Light
    COLOR_CO_L: [25, 75, 160, 30],
    COLOR_TD_L: [127, 0, 0, 30],
    COLOR_UK_L: [50, 50, 50, 30],

    ACTIVATION_DIST: 70,
    ACTIVATION_DIST_MIN: 0,
    ACTIVATION_DIST_MAX: 450,
    ACTIVATION_COLOR: [255, 0, 0, 50],
    CIRCLE_GROWTH_RATE: 6,
    MIN_SPEED: 30,
    SAMPLES_SPEED: 10,

    BUBBLE_WIDTH: 200,
    BUBBLE_HEIGHT: 110,

    BUBBLE_CIRCLE_WIDTH: 200,
    BUBBLE_CIRCLE_HEIGHT: 140,
    BUBBLE_CIRCLE_MAXDIST: 60,

    BUBBLE_GROWTH_W: 20,
    BUBBLE_GROWTH_H: 14,

    TEXT_SIZES: [
        15, // Dida ID
        13, // Gene name
        10 // Details
    ],

    LEGEND_WIDTH: 130,
    LEGEND_HEIGHT: 90,
    CIRCLE_DENSITY: 0.4,

    SEARCHER_BOTTOM_MARGIN: 20,
    SEARCHER_LEFT_MARGIN: 20,
    SEARCHER_WIDTH: 450,
    SEARCHER_FONT_SIZE: 12,
    SEARCHER_BAR_SPEED: 15,
    SEARCHER_DEFAULT: "Ex: dd056, Alport syndrome, BBS2",
    SEARCHER_REMOVE_DELAY: 2,
    SEARCHER_SUGGEST_COLOR: [150, 150, 150, 130],

    TD_DISABLED: false,
    CO_DISABLED: false,
    UK_DISABLED: true,

    IMAGES_PATH: "Images/",
    IMAGES: {
        HELP_BUTTON: "help_button.png",
        HELP_WINDOW: "help_window.png"
    },

    HELP_SHOWN: false,
    HELP_ALPHA: 0,
    HELP_SPEED: 15,

    DATA_PATH: "Data/",
    DATA_STRINGS: {
        "000": "v2_vs_nopath_nocoexp_noallstate.csv",
        "001": "v2_vs_nopath_nocoexp_allstate.csv",
        "010": "v2_vs_nopath_coexp_noallstate.csv",
        "011": "v2_vs_nopath_coexp_allstate.csv",
        "100": "v2_vs_path_nocoexp_noallstate.csv",
        "101": "v2_vs_path_nocoexp_allstate.csv",
        "110": "v2_vs_path_coexp_noallstate.csv",
        "111": "v2_vs_path_coexp_allstate.csv",
    },

    // Data manager keys
    PATHWAY: 0,
    COEXPRESSION: 1,
    ALLELICSTATE: 2
};
