FI_NAME, PYPATH = (
    "preparation.py",
    "/home/nversbra/anaconda3/envs/py36/bin/python"
)

with open('command_lines.txt', 'w') as f_output:
    for i in range(4096):
        n, file_name = i, ""
        while n > 0:
            file_name += str(n % 2)
            n //= 2
        file_name = file_name + "0"*(12 - len(file_name))
        f_output.write(" ".join(
            [PYPATH, FI_NAME, file_name + '\n']
        ))
