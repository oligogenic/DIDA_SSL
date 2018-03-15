from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import LeaveOneGroupOut
from sklearn.metrics.pairwise import rbf_kernel
from sklearn.metrics import roc_curve, roc_auc_score, auc, matthews_corrcoef

import sys
import time
import pandas as pd
import math

from numpy import array, concatenate, dot, diag

def main():

    # Csv gathering, it needs to be ordered.
    df_data = pd.read_csv(sys.argv[1])

    X, y, gene_pairs = (
        array(df_data)[:,1:-2].astype(float),
        array(df_data.replace('TD', 1).replace('CO', 0).replace('UK', -1))[:,-2].astype(int),
        array(df_data)[:,-1]
    )

    X, y, gene_pairs = X[y != -1], y[y != -1], gene_pairs[y != -1]

    X = dot(X, diag(list(map(int, sys.argv[5]))))

    def getScores(pred, real, threshold=None):
        """ Returns sen/spe/acc/bac/pre/mcc """

        if len(pred) != len(real):
            raise Exception("ERROR: input vectors have differente len!")

        if threshold is None:
            fpr, tpr, thr = roc_curve(real, pred)
            aucScore = roc_auc_score(real, pred)

            threshold = sorted(
                [ (fpr_i, tpr_i, thr_i) for fpr_i, tpr_i, thr_i in zip(fpr, tpr, thr) ],
                key=lambda x: math.sqrt(x[0]**2 + (1.0-x[1])**2)
            )[0][2] #(optimize threshold for the best AUC)

        tp, fp, fn, tn = (
            sum(r == 0 and p  < threshold for r, p in zip(real, pred)),
            sum(r == 0 and p >= threshold for r, p in zip(real, pred)),
            sum(r == 1 and p  < threshold for r, p in zip(real, pred)),
            sum(r == 1 and p >= threshold for r, p in zip(real, pred))
        )

        sen = tp / (tp + fn)
        spe = tn / (tn + fp)
        acc = (tp + tn) / len(real)
        bac = 0.5*( tp / (tp + fn) + tn / (tn + fp) )
        pre = tp / (tp + fp)
        mcc = (
            (tp * tn - fn * fp) / math.sqrt(
                (tp + fp) * (tp + fn) * (tn + fp) * (tn + fn)
            )
        )

        return [sen, spe, acc, bac, pre, mcc, aucScore]


    def LOGO_crossValidation(X, y, groups, N=50, threshold=None):
        """ Leave one group out cross validation. """

        clf = RandomForestClassifier(n_estimators=int(sys.argv[2]), max_depth=10, criterion='gini', min_samples_split=2, min_samples_leaf=2,
                                    bootstrap=True, n_jobs=1)
        logo = LeaveOneGroupOut()

        sum_sen, sum_spe, sum_mcc, sum_auc = 0, 0, 0, 0
        for i in range(N):

            start_time = time.time()
            values_t, values_p = [], []

            print("#"*10, "Trial %i" % i, "#"*10)
            # We leave one group out
            for train_index, test_index in logo.split(X, y, groups):

                X_fit, y_fit, X_train, y_train = (
                    X[train_index], y[train_index],
                    X[test_index],  y[test_index]
                )

                clf.fit(X_fit, y_fit)

                y_predicted = clf.predict_proba(X_train)
                values_t, values_p = values_t + [y for y in y_train], values_p + [y for y in y_predicted[:,1]]

            sen, spe, acc, bac, pre, mcc, auc = getScores(values_p, values_t)
            sum_sen += sen
            sum_spe += spe
            sum_mcc += mcc
            sum_auc += auc

            print('Duration:', round( (time.time() - start_time) * 100) / 100, 's')
            print('sen-spe-acc-bac-pre-mcc-auc')
            print('-'.join(map(lambda x: str(round(x*100)/100), [sen, spe, acc, bac, pre, mcc, auc])))

        print('Sensitivity: %f' % (sum_sen/N) )
        print('Specificity: %f'% (sum_spe/N) )
        print('MCC: %f' % (sum_mcc/N) )
        print('AUC: %f' % (sum_auc/N) )

    LOGO_crossValidation(X, y, gene_pairs, int(sys.argv[3]), None if float(sys.argv[4]) == -1 else float(sys.argv[4]))

if __name__ == "__main__":
    if sys.argv[1] in ("-h", "help"):
        print("Usage: python random_forest.py {file_name}.csv n_trees n_epochs threshold feature_selector \n \
                file: a csv file with DIDAID, features, DE, gene pair \n \
                n_trees: How many trees are contained in a forest. \n \
                n_epochs: How many pass you want to do. \n \
                threshold: threshold separation between classes in interval (0,1) \n \
                threshold = -1 => optimized at each pass \n \
                feature_selector: binary string of size #features corresponding to activated features.")
    else:
        main()
