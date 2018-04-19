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

    MIN_X: -0.3,
    MAX_X: 1.3,
    MIN_Y: -0.2,
    MAX_Y: 1.2,

    // Normal
    COLOR_CO: [51, 153, 255, 130],
    COLOR_TD: [255, 0, 0, 130],
    COLOR_UK: [100, 100, 100, 130],
    COLOR_CO_F: [30, 250, 120, 130],
    COLOR_TD_F: [250, 120, 30, 130],

    // Dark
    COLOR_CO_D: [25, 75, 160, 200],
    COLOR_TD_D: [127, 0, 0, 200],
    COLOR_UK_D: [50, 50, 50, 200],
    COLOR_CO_FD: [15, 125, 60, 200],
    COLOR_TD_FD: [125, 60, 15, 200],

    // Light
    COLOR_CO_L: [25, 75, 160, 30],
    COLOR_TD_L: [127, 0, 0, 30],
    COLOR_UK_L: [50, 50, 50, 30],
    COLOR_CO_FL: [30, 250, 120, 30],
    COLOR_TD_FL: [250, 120, 30, 30],

    ACTIVATION_DIST: 70,
    ACTIVATION_DIST_MIN: 0,
    ACTIVATION_DIST_MAX: 450,
    ACTIVATION_COLOR: [255, 0, 0, 50],
    CIRCLE_GROWTH_RATE: 6,
    MIN_SPEED: 30,
    SAMPLES_SPEED: 10,

    BUBBLE_WIDTH: 200,
    BUBBLE_HEIGHT: 110,

    BUBBLE_CIRCLE_WIDTH: 210,
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
    FEATURES_FILE: "dida_v2_full.csv",
    POSITION_REGX: 'positions/v2_vs_*.csv',
    FEATURES_AMOUNT: 12,
    FEATURES_NAMES: [
        "CADD1",
        "CADD2",
        "Recessive A",
        "Essential A",
        "CADD3",
        "CADD4",
        "Recessive B",
        "Essential B",
        "Biological distance",
        "Pathway-related",
        "Co-expression",
        "Allelic state"
    ],
    FEATURES_TEXTS_S: [
        "Pathogenicity A1",
        "Pathogenicity A2",
        "Recessiveness",
        "Essentiality (mouse)",
        "Pathogenicity B1",
        "Pathogenicity B2",
        "Recessiveness",
        "Essentiality (mouse)",
        "Genes distance",
        "Pathway-related",
        "Co-expressed",
        "Number of alleles"
    ],
    LEGEND_F_WIDTH: 140,
    LEGEND_F_HEIGHT: 270,

    COLOR_CHART_SIDE: 3,
    COLOR_CHART_X: -1,
    COLOR_CHART_Y: -1,
    COLOR_CHART_LINKED: null,

    RAND_STD: 0.008
};
