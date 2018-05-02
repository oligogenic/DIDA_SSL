################################################################################
##
##  2018/05/02
##
##  Author: Aziz Fouché, IB²
##  Version: 1.0
##  Python: 3.6
##
##  This implements a random forest in order to predict digenic effect of DIDA
##  combinations as discussed in this paper.
##
##  https://academic.oup.com/nar/article/45/15/e140/3894171
##
##  It performs stratified cross-validations and averages results over a given
##  amount of repeats. dida_v2_full.csv is an instance of valid CSV file.
##
################################################################################

import sys
import time
import pandas as pd

from math import sqrt
from numpy import array, concatenate, dot, diag, mean, std

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import LeaveOneGroupOut
from sklearn.metrics.pairwise import rbf_kernel
from sklearn.metrics import roc_curve, roc_auc_score, auc, matthews_corrcoef

def main(f_name, n_trees, n_epochs, threshold, selector):
    """

    Loads csv, launches cross-validation, displays scores

    f_name: str, path to reach the .csv file to evaluate predictor
    n_trees: int, amount of trees in forest
    n_epochs: int, amount of cross-validation to perform
    threshold: see getScores
    selector: str, boolean vector representing features to take into account
    """

    # .csv file MUST contains these columns
    features = [
        'CADD1', 'CADD2', 'RecA', 'EssA',
        'CADD3', 'CADD4', 'RecB', 'EssB',
        'Distance', 'Path', 'CoExp', 'AllelicState'
    ]
    assert len(selector) == len(features), "Features selector must fit features amount."
    to_keep = [f for i, f in enumerate(features) if selector[i] == '1']

    # Csv gathering, it needs to be ordered.
    df_data = pd.read_csv(f_name)

    X = array(df_data[to_keep])

    # TD: true digenic, CO: composite, UK: unknown
    y = array(
        df_data['DE'].replace('TD',1).replace('CO',0).replace('UK',-1).astype(int)
    )
    gene_pairs = array(df_data['Pair'])

    X, y, gene_pairs = X[y != -1], y[y != -1], gene_pairs[y != -1]

    print('Training on subspace {', ', '.join( to_keep ), '}.' )

    def getScores(pred, real, threshold=0.5):
        """

        Returns evaluation metrics to evaluate one cross-validation:
        Sensitivity, Specificity, Matthews_corrcoef and Area under the curve

        pred: probability vector predicted by the random forest
        real: true labels vector
        threshold: tuning parameter to favoritize one class
        """

        if len(pred) != len(real):
            raise Exception("ERROR: input vectors have differente len!")

        aucScore = roc_auc_score(real, pred)

        tp, fp, fn, tn = (
            sum(r == 0 and p  < threshold for r, p in zip(real, pred)),
            sum(r == 0 and p >= threshold for r, p in zip(real, pred)),
            sum(r == 1 and p  < threshold for r, p in zip(real, pred)),
            sum(r == 1 and p >= threshold for r, p in zip(real, pred))
        )

        sen = tp / (tp + fn)
        spe = tn / (tn + fp)
        mcc = (
            (tp * tn - fn * fp) / sqrt(
                (tp + fp) * (tp + fn) * (tn + fp) * (tn + fn)
            )
        )

        return sen, spe, mcc, aucScore

    def LOGO_crossValidation(X, y, groups, n_trees=100, n_epochs=50, threshold=0.5):
        """
        Stratified cross-validation.

        X: Design matrix
        y: label vector
        groups: Gene pair vector to define training groups
        N: number of cross validations to perform
        threshold: see getScores
        """

        logo = LeaveOneGroupOut()
        clf = RandomForestClassifier(
            n_estimators=n_trees,
            max_depth=10,
            criterion='gini',
            min_samples_split=2,
            min_samples_leaf=2,
            bootstrap=True,
            n_jobs=1
        )

        # Vectors to compute final results
        sum_sen, sum_spe, sum_mcc, sum_auc = [], [], [], []
        for i in range(n_epochs):

            start_time = time.time()
            values_t, values_p = [], []

            print("#"*10, "Trial %i" % i, "#"*10)
            # We leave one group out
            for train_index, test_index in logo.split(X, y, groups):

                X_fit, y_fit, X_train, y_train = (
                    X[train_index], y[train_index],
                    X[test_index],  y[test_index]
                )

                clf = clf.fit(X_fit, y_fit)

                y_predicted = clf.predict_proba(X_train)

                # predictions are concatenated
                values_t, values_p = values_t + [yi for yi in y_train], values_p + [yi for yi in y_predicted[:,1]]

            sen, spe, mcc, auc = getScores(values_p, values_t, threshold)
            sum_sen.append(sen)
            sum_spe.append(spe)
            sum_mcc.append(mcc)
            sum_auc.append(auc)

            print('Duration:', round( (time.time() - start_time) * 100) / 100, 's')
            print('sen-spe-mcc-auc')
            print('-'.join(map(lambda x: str(round(x*100)/100), [sen, spe, mcc, auc])))

        print('Sensitivity: %f, std: %f' % (mean(sum_sen), std(sum_sen)) )
        print('Specificity: %f, std: %f' % (mean(sum_spe), std(sum_spe)) )
        print('MCC: %f, std: %f'         % (mean(sum_mcc), std(sum_mcc)) )
        print('AUC: %f, std: %f'         % (mean(sum_auc), std(sum_auc)) )

    LOGO_crossValidation(X, y, gene_pairs, n_trees, n_epochs, threshold)

if __name__ == "__main__":
    # Args parsing

    # Flag help
    if sys.argv[1] in ("-h", "help"):
        print("Usage: python random_forest.py {file_name}.csv n_trees n_epochs threshold feature_selector \n \
                file: a csv file with DIDAID, features, DE, gene pair \n \
                n_trees: How many trees are contained in a forest. \n \
                n_epochs: How many pass you want to do. \n \
                threshold: threshold separation between classes in interval (0,1) \n \
                feature_selector: binary string of size #features corresponding to activated features.")
    else:

        # Arguments control

        f_name = sys.argv[1]
        assert len(f_name) >= 4 and f_name[-4:] == '.csv', f'Arg 1 must be a .csv file. Found: {f_name}'

        n_trees = sys.argv[2]
        try:
            n_trees = int(n_trees)
        except ValueError:
            raise Exception(f'Arg 2 must be an integer. Found: {n_trees}')

        n_epochs = sys.argv[3]
        try:
            n_epochs = int(n_epochs)
        except ValueError:
            raise f'Arg 3 must be an integer. Found: {n_epochs}'

        threshold = sys.argv[4]
        try:
            threshold = float(threshold)
        except ValueError:
            raise f'Arg 4 must be a float. Found: {threshold}'

        selector = sys.argv[5]
        assert all(c in ('0', '1') for c in selector), f'Arg 5 must be a selector composed of 0s and 1s. Found: {selector}'

        main(f_name, n_trees, n_epochs, threshold, selector)
