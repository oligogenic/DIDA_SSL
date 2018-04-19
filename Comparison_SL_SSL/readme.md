# Comparison SL/SSL
## Scripts used to compare between supervised methods and semi-supervised ones

The supervised method studied is learning by using *random forests*. Supervised script is **random_forest.py**.

Semi-supervised methods are based on a first relabeling pipeline. In these, unlabeled samples are given label following a guessing process.
- Distance-based relabeling, in which a weighted nearest neighbor is conducted on each unlabeled sample *u* to decide which label *u* should adopt
- Predictor-based whole relabeling, in which a predictor is trained on the labeled dataset in order to predict unlabeled samples, then a second predictor is trained on the whole set
- Predictor-based iterative relabeling, in which a predictor is trained on the labeled dataset in order to predict unlabeled samples, and relabels the most probable one, then iterates.

Note that each relabeling algorithm has two versions, *lb* which stands for *lower bound* and *ub* which stands for *upper bound*. In *lower bound*, relabeling is conducted at each fold without the group taken out leading to a loss of information in *lower bound* the relabeling is carried out at the beginning with all samples, leading to a circular bias.
