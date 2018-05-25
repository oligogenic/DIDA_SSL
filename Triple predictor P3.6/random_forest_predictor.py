################################################################################
##
##  2018/05/02
##
##  Author: Aziz Fouché, IB²
##  Version: 1.0
##  Python: 3.6
##
##  This implements a random forest in order to predict digenic effect of both
##  DIDA combinations (1) and dual diagnosis combinations (2). It aims to diffe-
##  rentiate between true digenic class, composite and dual diagnosis. This file
##  allows for predicting a distinct .csv file.
##
##  (1) https://academic.oup.com/nar/article/45/15/e140/3894171
##  (2) https://www.nejm.org/doi/full/10.1056/NEJMoa1516767
##
################################################################################

import sys
import time
import pandas as pd

from math import sqrt
from numpy import array, concatenate, dot, diag, mean, std, zeros

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import LeaveOneGroupOut
from sklearn.metrics.pairwise import rbf_kernel
from sklearn.metrics import roc_curve, roc_auc_score, auc, matthews_corrcoef

def main(f_fit, f_prd, n_trees, n_epochs, selector):
    """

    Loads csv, launches cross-validation, displays scores

    f_name: str, path to reach the .csv file to evaluate predictor
    n_trees: int, amount of trees in forest
    n_epochs: int, amount of cross-validation to perform
    thresholds: see getScores
    selector: str, boolean vector representing features to take into account
    """

    features = [
        'CADD1', 'CADD2', 'RecA', 'EssA',
        'CADD3', 'CADD4', 'RecB', 'EssB',
        'Path'
    ]
    assert len(selector) == len(features), "Features selector must fit features amount."
    to_keep = [f for i, f in enumerate(features) if selector[i] == '1']

    # Csv gathering, it needs to be ordered.
    df_data = pd.read_csv(f_fit)
    df_pred = pd.read_csv(f_prd)

    X_fit = array(df_data[to_keep])
    X_prd = array(df_pred[to_keep])
    id_pred = df_pred['id']

    # TD: true digenic, CO: composite, UK: unknown
    # OV: OVerlapping dual diagnosis, DI: Distinct dual diagnosis
    y = array(
        df_data['DE'].replace(
            'TD', 2
        ).replace(
            'CO', 1
        ).replace(
            'UK', -1
        ).replace(
            'OV', 0
        ).replace(
            'DI', 0
        ).replace(
            'DD', 0
        )
    )

    X_fit, y = X_fit[y != -1], y[y != -1]
    y = array([ [i == y_i for i in range(3)] for y_i in y])

    print('Training on subspace {', ', '.join( to_keep ), '}.' )

    def predict(X, y, X_pred, id_pred, n_trees=100, n_epochs=50, thresholds=[1,1,1]):
        """
        Stratified cross-validation.

        X: Design matrix
        y: label vector
        groups: Gene pair vector to define training groups
        n_trees: Amount of trees in random forest
        n_epochs: number of cross validations to perform
        thresholds: see getScores
        """

        clf = RandomForestClassifier(
            n_estimators=n_trees,
            max_depth=10,
            criterion='gini',
            min_samples_split=2,
            min_samples_leaf=2,
            bootstrap=True,
            n_jobs=1
        )

        N = len(X_prd)
        # Vector to compute final scores
        results = zeros( (N, 3) )
        for i in range(n_epochs):

            start_time = time.time()
            values_t, values_p = [], []

            print("#"*10, "Trial %i" % i, "#"*10)

            clf = clf.fit(X, y)
            y_pred = clf.predict_proba(X_pred)

            for l in range(3):
                for i in range(N):
                    results[i,l] += y_pred[l][i][1]

        results /= n_epochs
        with open('output.csv', 'w') as out:
            out.write('id,DD,CO,TD\n')
            for _id, r in zip(id_pred, results):
                dd, co, td = r
                out.write(','.join( map(str, [_id, dd, co, td]) ) + '\n')

    predict(X_fit, y, X_prd, id_pred, n_trees, n_epochs)

if __name__ == "__main__":
    if sys.argv[1] in ("-h", "help"):
        print("Usage: python random_forest_predictor.py {file_fit}.csv {file_predict}.csv n_epochs \n \
                file_fit: a csv file with DIDAID, features, DE, gene pair to train predictor \n \
                file_predict: a csv file with id, features, DE, gene pair to predict \n \
                n_epochs: How many passes you want to do, resultsare averaged.")
    else:
        # Arguments control

        f_fit = sys.argv[1]
        assert len(f_fit) >= 4 and f_fit[-4:] == '.csv', f'Arg 1 must be a .csv file. Found: {f_fit}'

        f_prd = sys.argv[2]
        assert len(f_prd) >= 4 and f_prd[-4:] == '.csv', f'Arg 2 must be a .csv file. Found: {f_prd}'

        n_epochs = sys.argv[3]
        try:
            n_epochs = int(n_epochs)
        except ValueError:
            raise f'Arg 3 must be an integer. Found: {n_epochs}'

        main(f_fit, f_prd, 100, n_epochs, '111111111')
