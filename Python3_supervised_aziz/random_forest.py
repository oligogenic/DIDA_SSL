from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import LeaveOneGroupOut
from sklearn.metrics.pairwise import rbf_kernel
from sklearn.metrics import roc_curve, roc_auc_score, auc, matthews_corrcoef

import sys
import time
import pandas as pd
import math

from numpy import array, concatenate, dot, diag, mean, std

def main():

    # Csv gathering, it needs to be ordered.
    df_data = pd.read_csv(sys.argv[1])
    df_data = df_data.drop(['Orphanet', 'Name'], axis=1)

    X, y, gene_pairs = (
        array(df_data)[:,1:-2].astype(float),
        array(df_data.replace(
            'TD', 1
        ).replace(
            'CO', 0
        ).replace(
            'UK', -1
        ))[:,-2].astype(int),
        array(df_data)[:,-1]
    )

    X, y, gene_pairs = X[y != -1], y[y != -1], gene_pairs[y != -1]

    assert len(sys.argv[5]) == len(X.T), "Features selector must fit features amount."
    X = dot(X, diag(list(map(int, sys.argv[5]))))

    def getScores(pred, real):
        """ Returns sen/spe/acc/bac/pre/mcc """

        if len(pred) != len(real):
            raise Exception("ERROR: input vectors have differente len!")

        threshold = 0.5
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
            (tp * tn - fn * fp) / math.sqrt(
                (tp + fp) * (tp + fn) * (tn + fp) * (tn + fn)
            )
        )

        return sen, spe, mcc, aucScore


    def LOGO_crossValidation(X, y, groups, N=50, threshold=None):
        """ Leave one group out cross validation. """

        logo = LeaveOneGroupOut()

        sum_sen, sum_spe, sum_mcc, sum_auc = [], [], [], []
        for i in range(N):

            start_time = time.time()
            values_t, values_p = [], []

            print("#"*10, "Trial %i" % i, "#"*10)
            # We leave one group out
            for train_index, test_index in logo.split(X, y, groups):

                clf = RandomForestClassifier(n_estimators=int(sys.argv[2]), max_depth=6, criterion='gini', min_samples_split=2, min_samples_leaf=2,
                                            bootstrap=True, n_jobs=1)

                X_fit, y_fit, X_train, y_train = (
                    X[train_index], y[train_index],
                    X[test_index],  y[test_index]
                )

                clf = clf.fit(X_fit, y_fit)

                y_predicted = clf.predict_proba(X_train)
                values_t, values_p = values_t + [yi for yi in y_train], values_p + [yi for yi in y_predicted[:,1]]

            sen, spe, mcc, auc = getScores(values_p, values_t)
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
