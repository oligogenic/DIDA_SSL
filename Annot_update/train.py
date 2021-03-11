#!/usr/bin/env python
# coding: utf-8

# In[54]:


from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import LeaveOneGroupOut
from sklearn.metrics.pairwise import rbf_kernel
from sklearn.metrics import roc_curve, roc_auc_score, auc, matthews_corrcoef

import sys
import time
import pandas as pd
import math

from numpy import array, concatenate, dot, diag, mean, std, median


# In[55]:


train_f = "DE_train.csv"


# In[56]:




df_data = pd.read_csv(train_f)



# In[57]:


Rec_m = list(df_data['RecA'])
Rec_m += list(df_data['RecB'])
Rec_v = []
for e in Rec_m:
    if e != "None":
        Rec_v.append(e)
        
Rec_v  = [float(x) for x in Rec_v]
Rec_m = median(Rec_v)


# In[58]:


df_data.loc[df_data.RecA == 'None', 'RecA'] = Rec_m
df_data.loc[df_data.RecB == 'None', 'RecB'] = Rec_m


# In[59]:


df_data


# In[60]:


X = (array(df_data)[:,1:-2].astype(float))
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

gene_pairs = array(df_data['GP'])
#    X_pred = array(df_prediction)[:,1:11]


# In[63]:


gene_pairs


# In[ ]:





# In[ ]:





# In[74]:


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
        'sen': [{'count': 0, 'recognized': 0} for _ in range(3)],
        'spe': [{'count': 0, 'true': 0} for _ in range(3)],
    }
    for i, r_tab in enumerate(real):
        r = max(range(3), key=lambda k: r_tab[k])
        p = max(range(3), key=lambda k: pred[i][k] * thresholds[k])
        results['sen'][r]['count'] += 1
        results['spe'][p]['count'] += 1
        if p == r:
            results['sen'][p]['recognized'] += 1
            results['spe'][p]['true'] += 1

    return map(
        lambda x: round(x * 100) / 100,
        [r['recognized'] / r['count'] for r in results['sen']] + [r['true'] / r['count'] for r in results['spe']]
    )


def LOGO_crossValidation(X, y, groups, n_trees=100, n_epochs=50, thresholds=[1, 1, 1]):
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

        print("#" * 10, "Trial %i" % i, "#" * 10)
        # We leave one group out
        for train_index, test_index in logo.split(X, y, groups):

            X_fit, y_fit, X_train, y_train = (
                X[train_index], y[train_index],
                X[test_index], y[test_index]
            )

            clf = clf.fit(X_fit, y_fit)


            y_predicted = clf.predict_proba(X_train)

            # y_predicted is not shaped correctly. Reshape it to fit
            # getScores expectations.
            y_formatted = [[0, 0, 0] for _ in range(len(y_predicted))]
            for de in (0, 1, 2):
                for i, proba in enumerate(y_predicted[:, 1]):
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

        print('Duration:', round((time.time() - start_time) * 100) / 100, 's')
        print('sen | dd - co - td / spe | dd - co - td')
        print('sen | ' + '-'.join(map(str, (sen_dd, sen_co, sen_td))) + ' / spe | ' + '-'.join(
            map(str, (spe_dd, spe_co, spe_td))))

# In[75]:


LOGO_crossValidation(X,y, gene_pairs)

