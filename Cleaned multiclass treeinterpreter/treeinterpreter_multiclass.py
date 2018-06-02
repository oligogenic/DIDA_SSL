from numpy import zeros
from sklearn.tree import _tree

def _interpret_tree(tree, X, n_labels):

    # Tree preprocessing allowing down-top search

    parents = [-1 for _ in range(tree.node_count)]
    to_pursue = [0]
    while len(to_pursue):
        node_i = to_pursue.pop()
        child_l = tree.children_left[node_i]
        if child_l != _tree.TREE_LEAF:
            parents[child_l] = node_i
            child_r = tree.children_right[node_i]
            parents[child_r] = node_i
            to_pursue.append(child_l)
            to_pursue.append(child_r)

    # Values normalization -> probas

    values = tree.value.squeeze(axis=1)
    values /= values.sum(axis=1)[:, np.newaxis]

    n_features = len(X[0])

    f_contribs = [ zeros( (1, n_labels) ) for _ in range(n_features) ]
    biases = zeros( (1, n_labels) )
    f_indices = list(tree.feature)

    # For each sample to test, we check in which leaf it lands

    leaves = tree.apply(X)

    # For each leaf, we trace back the decision process
    for leaf in leaves:
        cur_node = leaf
        while cur_node != -1:
            par_node = parents[cur_node]
            if par_node >= 0:
                resp_feature = f_indices[par_node]
                f_contribs[resp_feature] += (values[cur_node] - values[par_node])
            cur_node = par_node
        biases += values[leaf]
    f_contribs = [i/len(X) for i in f_contribs]
    biases /= len(X)

    return f_contribs, biases

def interpret_forest(forest, X, n_labels):
    f_contribs = [ zeros( (1, n_labels) ) for _ in range(len(X[0])) ]
    f_biases = 0
    for tree in map(lambda x: x.tree_, forest.estimators_):
        t_contribs, t_biases = _interpret_tree(tree, X, n_labels)
        f_contribs = [x + y/forest.n_estimators for x, y in zip(f_contribs, t_contribs)]
        f_biases += t_biases/forest.n_estimators
    return f_contribs, f_biases
