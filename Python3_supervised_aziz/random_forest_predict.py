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
    df_data = df_data.drop(['Orphanet', 'Name', 'Distance', 'AllelicState', 'CoExp'], axis=1)

    # To predict gathering
    df_prediction = pd.read_csv(sys.argv[2])

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
    X_pred = array(df_prediction)[:,1:11]

    X, y, gene_pairs = X[y != -1], y[y != -1], gene_pairs[y != -1]

    assert len(sys.argv[5]) == len(X.T), "Features selector must fit features amount."
    feature_selector = [i for i in range(len(X.T)) if sys.argv[5][i] == '1']
    X = X[:,feature_selector]
    X_pred = X_pred[:,feature_selector]

    features = [
        'CADD1', 'CADD2', 'RecA', 'EssA',
        'CADD3', 'CADD4', 'RecB', 'EssB',
        'Pathway'
    ]

    print('Training on subspace {', ', '.join( features[i] for i in feature_selector ), '}.' )

    def getScores(pred, real, threshold=0.5):
        """ Returns sen/spe/acc/bac/pre/mcc """

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
            (tp * tn - fn * fp) / math.sqrt(
                (tp + fp) * (tp + fn) * (tn + fp) * (tn + fn)
            )
        )

        return sen, spe, mcc, aucScore


    def predict(X, y, to_predict, n_trees=100, N=50):
        """ Predicts to_predict matrix labels, averaging N folds """

        clf = RandomForestClassifier(n_estimators=n_trees, max_depth=10, criterion='gini', min_samples_split=2, min_samples_leaf=2,
                                    bootstrap=True, n_jobs=1)

        results = [[] for _ in range(len(to_predict))]

        for i in range(N):
            print('#'*15, 'Fold', i, '#'*15)

            clf = clf.fit(X, y)
            y_pred = clf.predict_proba(to_predict)
            results = [r_i + [y_i[1]] for r_i, y_i in zip(results, y_pred)]

        return [mean(r_i) for r_i in results], [std(r_i) for r_i in results]

    predictions, stds = predict(X, y, X_pred, int(sys.argv[3]), int(sys.argv[4]))
    with open('posey_predictions_aziz.csv', 'w') as f_out:
        f_out.write('tpid,GenePair,Type,Prediction,std\n')
        for row, prediction, std_ in zip(df_prediction.iterrows(), predictions, stds):
            row = row[1]
            f_out.write(','.join( map(str, [row['tpid'], row['GenePair'], row['Type'], prediction, std_]) ) + '\n')


if __name__ == "__main__":
    if sys.argv[1] in ("-h", "help"):
        print("Usage: python random_forest.py {train_name}.csv {test_name}.csv n_trees n_epochs feature_selector \n \
                train: a csv file with DIDAID, features, DE, gene pair to train predictor on \n \
                test: a csv file with TPID, features, gene pair, type to predict \n \
                n_trees: How many trees are contained in a forest. \n \
                n_epochs: How many pass you want to do. \n \
                threshold: threshold separation between classes in interval (0,1) \n \
                feature_selector: binary string of size #features corresponding to activated features.")
    else:
        main()
