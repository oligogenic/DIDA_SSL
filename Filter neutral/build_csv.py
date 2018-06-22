N = 5132661
desired = 10000

p = desired/N

import random

with open('all.csv', 'r') as f_in:
    with open('to_test.csv', 'w') as out:
        out.write('id,CADD1,CADD2,RecA,EssA,CADD3,CADD4,RecB,EssB,Path\n')
        for line in f_in:
            if random.random() <= p:
                out.write(line)
