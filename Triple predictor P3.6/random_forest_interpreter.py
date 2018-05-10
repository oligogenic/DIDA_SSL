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
##  decomposes predictions using (3) in order to understand which feature con-
##  tributes to the decision process.
##
##  (1) https://academic.oup.com/nar/article/45/15/e140/3894171
##  (2) https://www.nejm.org/doi/full/10.1056/NEJMoa1516767
#   (3) https://github.com/andosa/treeinterpreter
##
##  It performs stratified cross-validations and averages results over a given
##  amount of repeats. dida_dualdiag.csv is an instance of valid CSV file.
##
################################################################################

import sys
import time
import pandas as pd

from numpy import array, concatenate, dot, diag, mean, std, zeros
from treeinterpreter import treeinterpreter as ti

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import LeaveOneGroupOut

def main(f_name, n_trees, n_epochs, threshold, selector):
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
    df_data = pd.read_csv(f_name)

    X = array(df_data[to_keep])

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
    gene_pairs = array(df_data['Pair'])

    X, y, gene_pairs = X[y != -1], y[y != -1], gene_pairs[y != -1]

    print('Training on subspace {', ', '.join( to_keep ), '}.' )

    def LOGO_crossValidation(X, y, groups, n_trees=100, n_epochs=50, thresholds=[1,1,1]):
        """
        Stratified cross-validation.

        X: Design matrix
        y: label vector
        groups: Gene pair vector to define training groups
        n_trees: Amount of trees in random forest
        n_epochs: number of cross validations to perform
        thresholds: see getScores
        """

        logo = LeaveOneGroupOut()

        def clf():
            return RandomForestClassifier(
                n_estimators=n_trees,
                max_depth=10,
                criterion='gini',
                min_samples_split=2,
                min_samples_leaf=2,
                bootstrap=True,
                n_jobs=1
            )

        # Vectors to decompose prediction
        sum_pros_c = [zeros( (1,9) ) for _ in range(3)]
        sum_cons_c = [zeros( (1,9) ) for _ in range(3)]
        sum_pros_b = [0 for _ in range(3)]
        sum_cons_b = [0 for _ in range(3)]
        for i in range(n_epochs):

            start_time = time.time()
            values_t, values_p = [], []

            print('#'*30)
            print("#"*10, "Trial %i" % i, "#"*10)
            # We leave one group out
            for train_index, test_index in logo.split(X, y, groups):

                X_fit, y_fit, X_train, y_train = (
                    X[train_index], y[train_index],
                    X[test_index],  y[test_index]
                )

                clfs = [clf().fit(X_fit, y_fit == i) for i in range(3)]
                results = [{
                    'prediction': p,
                    'bias': b,
                    'contributions': c
                } for p, b, c in map(lambda c: ti.predict(c, X_train), clfs)]

                for i, clf_res in enumerate(results):
                    pred = clf_res['prediction'][:,0] - 0.5
                    bias = clf_res['bias'][:,0]
                    cont = clf_res['contributions'][:,:,0]
                    for j, p_j in enumerate(pred):
                        if p_j < 0:
                            sum_cons_c[i] += cont[j]*p_j
                            sum_cons_b[i] -= bias[j]*p_j
                        else:
                            sum_pros_c[i] += cont[j]*p_j
                            sum_pros_b[i] += bias[j]*p_j

            print('Duration:', round( (time.time() - start_time) * 100) / 100, 's')


        print('#'*30)
        print('Contributions pro:')
        print('DD - ', ','.join(map(str, sum_pros_c[0][0]/n_epochs)))
        print('CO - ', ','.join(map(str, sum_pros_c[1][0]/n_epochs)))
        print('TD - ', ','.join(map(str, sum_pros_c[2][0]/n_epochs)))
        print('#'*30)
        print('Contributions con:')
        print('DD - ', ','.join(map(str, sum_cons_c[0][0]/n_epochs)))
        print('CO - ', ','.join(map(str, sum_cons_c[1][0]/n_epochs)))
        print('TD - ', ','.join(map(str, sum_cons_c[2][0]/n_epochs)))
        print('#'*30)
        print('Bias pro:')
        print('DD - ', sum_pros_b[0]/n_epochs)
        print('CO - ', sum_pros_b[1]/n_epochs)
        print('TD - ', sum_pros_b[2]/n_epochs)
        print('Bias con:')
        print('#'*30)
        print('DD - ', sum_cons_b[0]/n_epochs)
        print('CO - ', sum_cons_b[1]/n_epochs)
        print('TD - ', sum_cons_b[2]/n_epochs)

    LOGO_crossValidation(X, y, gene_pairs, n_trees, n_epochs, thresholds)

if __name__ == "__main__":
    if sys.argv[1] in ("-h", "help"):
        print("Usage: python random_forest.py {file_name}.csv n_trees n_epochs thresholds feature_selector \n \
                file: a csv file with DIDAID, features, DE, gene pair \n \
                n_trees: How many trees are contained in a forest. \n \
                n_epochs: How many pass you want to do. \n \
                thresholds: relative thresholds for each digenic effect \n \
                thresholds are multiplicative and must be hyphen-separated such as 1.2-1.1-1 \n \
                thresholds = -1 => default, otherwise [dd,co,td] \n \
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

        def thr_parse(thresholds):
            if thresholds == '-1': return [1,1,1];
            thresholds = thresholds.split('-')
            if len(thresholds) < 3:
                raise ValueError()
            try:
                thresholds = [float(t) for t in thresholds]
            except ValueError:
                raise ValueError()
            return  thresholds

        thresholds = sys.argv[4]
        try:
            thresholds = thr_parse(thresholds)
        except ValueError:
            raise f'Arg 4 must be either -1 or shaped f-f-f. Found: {threshold}'

        selector = sys.argv[5]
        assert all(c in ('0', '1') for c in selector), f'Arg 5 must be a selector composed of 0s and 1s. Found: {selector}'

        main(f_name, n_trees, n_epochs, thresholds, selector)
