def binary(n):
    if n not in binary.memoize:
        binary.memoize[n] = binary(n//2) + str(n % 2)
    return binary.memoize[n]
binary.memoize = {0: '0', 1: '1'}

def get_binary_l(n, l):
    bin_str = binary(n)
    return (l - len(bin_str))*'0' + bin_str

n_f = 9
with open('command_lines.txt', 'w') as out:
    for i in range(2**n_f):
        out.write('/home/nversbra/anaconda3/envs/py36/bin/python random_forest.py dida_posey_to_predict.csv 100 50 1-1-1 %s\n' % get_binary_l(i, n_f))
