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
##  rentiate between true digenic class, composite and dual diagnosis.
##
##  (1) https://academic.oup.com/nar/article/45/15/e140/3894171
##  (2) https://www.nejm.org/doi/full/10.1056/NEJMoa1516767
##
##  It performs stratified cross-validations and averages results over a given
    ##  amount of repeats. dida_dualdiag.csv is an instance of valid CSV file.
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
        )
    )
    gene_pairs = array(df_data['Pair'])

    X, y, gene_pairs = X[y != -1], y[y != -1], gene_pairs[y != -1]
    y = array([ [i == y_i for i in range(3)] for y_i in y])

    print('Training on subspace {', ', '.join( to_keep ), '}.' )

    def getScores(pred, real, thresholds=[1, 1, 1]):
        """

        Returns evaluation metrics to evaluate one cross-validation:
        For each class, Sensitivity and Specificity. Order:
        sen_dd, sen_co, sen_td, spe_dd, spe_co, spe_td

        pred: Predicted probabilities. For each sample, vector is such as
        [pred_dd, pred_co, pred_td]
        real: real label. A label is a 3-long boolean vector.
        DD: [1, 0, 0] - CO: [0, 1, 0] - TD: [0, 0, 1]
        thresholds: weightings to compensate lack of data in certain class.
        """

        if len(pred) != len(real):
            raise Exception("ERROR: input vectors have differente len!")

        results = {
            'sen': [ { 'count': 0, 'recognized': 0 } for _ in range(3) ],
            'spe': [ { 'count': 0, 'true': 0 } for _ in range(3) ],
        }
        for i, r_tab in enumerate(real):
            r = max(range(3), key=lambda k: r_tab[k])
            p = max(range(3), key=lambda k: pred[i][k]*thresholds[k])
            results['sen'][r]['count'] += 1
            results['spe'][p]['count'] += 1
            if p == r:
                results['sen'][p]['recognized'] += 1
                results['spe'][p]['true'] += 1

        return map(
            lambda x: round(x*100)/100,
            [r['recognized'] / r['count'] for r in results['sen']] + [r['true'] / r['count'] for r in results['spe']]
        )


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
        clf = RandomForestClassifier(
            n_estimators=n_trees,
            max_depth=10,
            criterion='gini',
            min_samples_split=2,
            min_samples_leaf=2,
            bootstrap=True,
            n_jobs=1
        )

        # Vector to compute final scores
        sum_dd_se, sum_co_se, sum_td_se = [], [], []
        sum_dd_sp, sum_co_sp, sum_td_sp = [], [], []
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

                # y_predicted is not shaped correctly. Reshape it to fit
                # getScores expectations.
                y_formatted = [ [0, 0, 0] for _ in range(len(y_predicted[0])) ]
                for de in (0, 1, 2):
                    for i, proba in enumerate(y_predicted[de][:,1]):
                        y_formatted[i][de] = proba
                # Predictions are concatenated into a prediction vector
                values_t, values_p = values_t + [yi for yi in y_train], values_p + [yi for yi in y_formatted]

            sen_dd, sen_co, sen_td, spe_dd, spe_co, spe_td = getScores(values_p, values_t, thresholds)

            sum_dd_se.append(sen_dd)
            sum_co_se.append(sen_co)
            sum_td_se.append(sen_td)
            sum_dd_sp.append(spe_dd)
            sum_co_sp.append(spe_co)
            sum_td_sp.append(spe_td)

            print('Duration:', round( (time.time() - start_time) * 100) / 100, 's')
            print('sen | dd - co - td / spe | dd - co - td')
            print('sen | ' + '-'.join(map(str, (sen_dd, sen_co, sen_td))) + ' / spe | ' + '-'.join(map(str, (spe_dd, spe_co, spe_td))))

        print('Sen DD: %f, std: %f' % (mean(sum_dd_se), std(sum_dd_se)) )
        print('Sen CO: %f, std: %f' % (mean(sum_co_se), std(sum_co_se)) )
        print('Sen TD: %f, std: %f' % (mean(sum_td_se), std(sum_td_se)) )
        print('Spe DD: %f, std: %f' % (mean(sum_dd_sp), std(sum_dd_sp)) )
        print('Spe CO: %f, std: %f' % (mean(sum_co_sp), std(sum_co_sp)) )
        print('Spe TD: %f, std: %f' % (mean(sum_td_sp), std(sum_td_sp)) )

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
