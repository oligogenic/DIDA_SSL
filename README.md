# DIDA_SSL

This repository regroups work done by IB² about digenic diseases study, using machine learning. Sources used to obtain results discussed in the article *Unraveling the spectrum of bi-locus diseases*.

## Paper materials

- Prediction scripts can be found in *Triple predictor P3.6/random_forest.py*
- Full dataset can be found in *Triple predictor P3.6/dida_posey_to_predict.csv*
- Scripts to get t-SNE visualizations are in *Visualizer_preparation/tsne-visualizations.ipynb*
- Game theory analysis scripts can be found in *Shapley/shapley.ipynb*
- Tree interpretation can be found in *Triple predictor P3.6/random_forest_interpreter.py*

## Exhaustive summary

### Andrea
- Materials of paper https://academic.oup.com/nar/article/45/15/e140/3894171

### Python3_supervised_aziz
- Pursuing of Andrea's work
- Python3 implementation of his methods
- Supplementary data

### Shapley
- Shapley value to determine features importance

### Visualizer_dida
- Javascript tool using t-SNE dimension reduction
- Allowing to visualize digenic disorders
- demo here: http://dtype.ibsquare.be/

### Visualizer_preparation
- Scripts to generate visualizer t-SNE data

### annotation
- Scripts to add pathway information to gene pairs
- Datasets of pathways from KEGG and Reactome

### results
- CSV results of experiments.
- Forest size performance
- t-SNE precomputation for visualizer
- Prediction per feature combination
