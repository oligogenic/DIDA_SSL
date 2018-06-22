import sys

file_name = sys.argv[1]
with open(file_name, 'r') as file:
    name_noex = file_name.split('.')[0]
    with open(name_noex + '.fil', 'w') as out:
        for line in file:
            elements = line.split(',')
            if 'None' not in elements:
                out.write(line)
