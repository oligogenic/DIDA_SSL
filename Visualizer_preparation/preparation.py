import pandas as pd
from sklearn.manifold import TSNE

from numpy import array, dot, diag, nan_to_num
from numpy.random import randn

import sys

features = 'CADD1,CADD2,RecA,EssA,CADD3,CADD4,RecB,EssB,Path'.split(',')

df_data = pd.read_csv("dida_posey_to_predict.csv")
df_data.head()

combination = list(map(int, sys.argv[1]))
n_comb = sum(combination)
X = array(df_data[features])
X = dot(X, diag(combination))

X[:,[0,1,4,5]] -= X[:,[0,1,4,5]].min()
X[:,[0,1,4,5]] /= X[:,[0,1,4,5]].max()

if n_comb > 2:
    X = TSNE(n_components=2, init="pca").fit_transform(X)
    X = (X - X.min(axis=0)) / (X.max(axis=0) - X.min(axis=0))
    X = nan_to_num(X)
else:
    X = X[:, combination]

df_data_vs = df_data.copy(False)
df_data_vs['x'] = X[:,0]
df_data_vs['y'] = X[:,1] if n_comb > 1 else 0
df_data_vs = df_data_vs.drop('Pair', 1)

with open("exports/p_file_" + ''.join(map(str, combination)) + ".csv", "w") as out:
    out.write('id,x,y\n')
    for line in array(df_data_vs):
        out.write(','.join(map(str, line[[0,-2,-1]])) + '\n')
