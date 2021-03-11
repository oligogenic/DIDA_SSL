
v_f = open("vars.csv")
c_f = open("combs.csv")


combs = {}
var = {}

v_f.readline()
for l in v_f:
    sl = l.split("\t")
    var[sl[5]+sl[6]] = [sl[2], sl[1], sl[3], sl[4]]

c_f.readline()
for l in c_f:
    sl = l.split("\t")
    ga = sl[1]

    ga1 = sl[2]
    ga2 = sl[4]

    gb = sl[6]
    gb1 = sl[7]
    gb2 = sl[9]

    eff = sl[12]
    if ga2 != '"wild type"' and gb2 != '"wild type"':
        combs[sl[0]] = [var[ga+ga1], var[ga+ga2], var[gb+gb1], var[gb+gb2], eff]
        v1 = var[ga+ga1]
        v2 = var[ga+ga2]
        v3 = var[gb+gb1]
        v4 = var[gb+gb2]

        if v1 != v2:
            v1 = ":".join(v1)+"/"+":".join(v2)
        else:
            v1 = ":".join(v1)

        if v3 != v4:
            v3 = ":".join(v3)+"/"+":".join(v4)
        else:
            v3 = ":".join(v3)
        print(sl[0] + "," + v1 + "," + v3 + "," + eff)

    elif ga2 != '"wild type"':
        combs[sl[0]] = [var[ga + ga1], var[ga + ga2], var[gb + gb1],  eff]
        v1 = var[ga + ga1]
        v2 = var[ga + ga2]
        v3 = var[gb + gb1]


        if v1 != v2:
            v1 = ":".join(v1) + "/" + ":".join(v2)
        else:
            v1 = ":".join(v1)
        v3 = ":".join(v3)

        print(sl[0] + "," + v1 + "," + v3 + "," + eff)
    elif gb2 != '"wild type"':

        v1 = var[ga + ga1]

        v3 = var[gb + gb1]
        v4 = var[gb + gb2]

        v1 = ":".join(v1)

        if v3 != v4:
            v3 = ":".join(v3) + "/" + ":".join(v4)
        else:
            v3 = ":".join(v3)
        print(sl[0] + "," + v1 + "," + v3 + "," + eff)


        combs[sl[0]] = [var[ga + ga1], var[gb + gb1], var[gb + gb2], eff]
        
    else:
        combs[sl[0]] = [var[ga + ga1], var[gb + gb1], eff]
        print(sl[0] + ","+":".join(var[ga + ga1]) +  "," + ":".join(
            var[gb + gb1]) + "," + eff)

#print(combs)