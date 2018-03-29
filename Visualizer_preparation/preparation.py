import pandas as pd
from sklearn.manifold import TSNE

from numpy import array, dot, diag, nan_to_num
from numpy.random import randn

import sys

df_data = pd.read_csv("dida_v2_full.csv", index_col=0)
df_data.head()

file_name = sys.argv[1]
X = array(df_data.drop(['Pair', 'DE', 'Orphanet', 'Name'], 1))
X = dot(X, diag([float(i) for i in file_name]))

X_transform = TSNE(n_components=2, init="pca").fit_transform(X)
X_transform = (X_transform - X_transform.min(axis=0)) / (X_transform.max(axis=0) - X_transform.min(axis=0))
X_transform = nan_to_num(X_transform)

df_data_vs = df_data.copy(False)
df_data_vs['x'] = X_transform[:,0]
df_data_vs['y'] = X_transform[:,1]
df_data_vs = df_data_vs.drop(
    [
        'CADD1', 'CADD2', 'RecA', 'EssA',
        'CADD3', 'CADD4', 'RecB', 'EssB',
        'Distance', 'Path', 'CoExp','AllelicState',
        'DE', 'Pair', 'Orphanet', 'Name'
    ],
    axis=1
)

X_transform += randn(len(X_transform), 2) / 80
df_data_vs.to_csv("exports/v2_vs_" + file_name + ".csv")
