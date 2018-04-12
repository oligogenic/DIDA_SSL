from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import LeaveOneGroupOut
from sklearn.metrics.pairwise import rbf_kernel
from sklearn.metrics import roc_curve, roc_auc_score, auc, matthews_corrcoef

import sys
import time
import pandas as pd
import math

from numpy import array, concatenate, dot, diag, zeros, delete, vectorize, mean, std
from scipy.spatial import distance_matrix

def main():

    # Csv gathering, it needs to be ordered.
    df_data = pd.read_csv(sys.argv[1])
    df_data = df_data.drop(['Orphanet', 'Name'], axis=1)

    Xf, yf, gene_pairs = (
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

    assert len(sys.argv[5]) == len(Xf.T), "Features selector must fit features amount."
    Xf = dot(Xf, diag(list(map(int, sys.argv[5]))))

    X_l, y_l, gene_pairs = Xf[yf >= 0], yf[yf >= 0], gene_pairs[yf >= 0]
    X_u, y_u = Xf[yf == -1], yf[yf == -1]

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

    def get_y(X, y, thr=0, lbd=100):

        def convert(x):
            if x < -thr:
                return 'CO2'
            elif x > thr:
                return 'TD2'
            return 'UK'

        red_X = dot(X, diag([0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0]))
        distances = vectorize(math.exp)(-lbd*distance_matrix(red_X, red_X))
        y_to_int = array(y, copy=True)
        y_to_int[y == -1] = 0
        y_to_int[y ==  0] = -1

        new_y = []
        for i, xy in enumerate(zip(red_X, y_to_int)):
            xi, yi = xy
            if yi:
                continue
            new_y.append(convert(sum(
                0.5*y_to_int[j]*(distances[i, j] + distances[j, i]) for j in range(len(X))
            )))
        return array(new_y)


    def LOGO_crossValidation(X, y, X_sup, y_sup, groups, N=50, threshold=None):
        """ Leave one group out cross validation. Returns best classifier. """

        logo = LeaveOneGroupOut()
        clf = RandomForestClassifier(n_estimators=int(sys.argv[2]), max_depth=6, criterion='gini', min_samples_split=2, min_samples_leaf=2,
                                        bootstrap=True, n_jobs=1)

        sum_sen, sum_spe, sum_mcc, sum_auc = [], [], [], []
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

                X_fit = concatenate( (X_fit, X_sup) )
                y_fit = concatenate( (y_fit, y_sup) )

                clf = clf.fit(X_fit, y_fit)

                y_predicted = clf.predict_proba(X_train)
                values_t, values_p = values_t + [yi for yi in y_train], values_p + [yi for yi in y_predicted[:,1]]

            sen, spe, acc, bac, pre, mcc, auc = getScores(values_p, values_t)
            sum_sen.append(sen)
            sum_spe.append(spe)
            sum_mcc.append(mcc)
            sum_auc.append(auc)

            print('Duration:', round( (time.time() - start_time) * 100) / 100, 's')
            print('sen-spe-acc-bac-pre-mcc-auc')
            print('-'.join(map(lambda x: str(round(x*100)/100), [sen, spe, acc, bac, pre, mcc, auc])))

        print('Sensitivity: %f, std: %f' % (mean(sum_sen), std(sum_sen)) )
        print('Specificity: %f, std: %f' % (mean(sum_spe), std(sum_spe)) )
        print('MCC: %f, std: %f'         % (mean(sum_mcc), std(sum_mcc)) )
        print('AUC: %f, std: %f'         % (mean(sum_auc), std(sum_auc)) )

    y_sup = get_y(
        concatenate( (X_l, X_u) ),
        concatenate( (y_l, y_u) ),
        0,
        100
    )

    LOGO_crossValidation(
        X_l, y_l,
        X_u, y_sup,
        gene_pairs,
        int(sys.argv[3]),
        None if float(sys.argv[4]) == -1 else float(sys.argv[4])
    )

if __name__ == "__main__":
    if sys.argv[1] in ("-h", "help"):
        print("Usage: python iterative_ssl.py {file_name}.csv n_trees n_epochs threshold feature_selector \n \
                file: a csv file with DIDAID, features, DE, gene pair \n \
                n_trees: How many trees are contained in a forest. \n \
                n_epochs: How many pass you want to do. \n \
                threshold: threshold separation between classes in interval (0,1) \n \
                threshold = -1 => optimized at each pass \n \
                feature_selector: binary string of size #features corresponding to activated features.")
    else:
        main()
