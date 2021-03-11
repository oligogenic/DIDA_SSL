import sys

import psycopg2

host_addr = 'localhost'
cur = None

def adapt_indels_biomart(pos, ref, alt):
    pos = int(pos)
    if ref == '-' or alt == '-':
        return pos, ref, alt
    elif ref == alt[0:1] and len(ref) < len(alt):
        return pos + 1, '-', alt[1:]
    elif alt == ref[0:1] and len(ref) > len(alt):
        return pos + 1, ref[1:], '-'
    else:
        return pos, ref, alt


# def annotate(chrom, pos, ref, alt, sex='M'):
def annotate(a):
    global cur
    #print(a)
    l = a.split(",")
    #print()
    #print(l)
    chrom = l[0]
    pos = l[1]
    ref = l[2]
    alt = l[3]

    pos, ref, alt = adapt_indels_biomart(int(pos), ref, alt)

    na = ",".join([chrom, str(pos), ref, alt])


    varid = None
    if cur is None:
        conn = psycopg2.connect(
            "dbname='annotationv2' user ='annotation' host=" + host_addr + " password='annotationibsquare' ")
        print("connected")
        cur = conn.cursor()

        print("cursor gotten")
    try:

        cur.execute(
            "SELECT composite_key, chr, pos, ref, alt, aa_pos, aa_ref, aa_alt, cadd_raw, gene.ensembl_gene_id, ensembl_can_transcript_id, gene_name, p_rec, gdi, array_agg(pathway_id), gene.essential_in_mouse FROM variant INNER JOIN gene USING(ensembl_gene_id) LEFT JOIN protein_to_pathway USING(gene_name) WHERE composite_key = \'" + na + "\' GROUP BY (composite_key, gene.ensembl_gene_id); ")
        gene_vars = cur.fetchall()

        # for i in range(len(gene_vars)):
        # print(gene_vars[i])

        gene_vars = gene_vars[0]
        cadd = gene_vars[8]
        rec = gene_vars[12]
        gdi = gene_vars[13]
        path = gene_vars[14]
        ess = gene_vars[15]
        return(cadd, rec, gdi, ess, path)


    except Exception as e:  # make more specific to instance doesnt exist if gene_var should become none
        #print(" annot err: ", e, "\t\t", na)
        print( na)



dida = False
if "DIDA" in sys.argv[1]:
    dida = True

dida_types = {}
if dida:
    f = open("/Users/nversbra/Downloads/dida_types")
    for l in f:
        sl = l.strip().split(",")
        dida_types[sl[0]]= sl[1]



f = open(sys.argv[1])
f.readline()
default_c = -1

res_f = open("/Users/nversbra/Downloads/DE_train.csv",'w')

ln = 0
for l in f:
    print(ln)
    ln+=1
    v11 = None
    v12 = None
    v21 = None
    v22 = None
    l = l.replace(':', ',')
    c = l.split('\t')
   # print()
   # print(c)
   # print()
    type= 'DD'
    id = c[0]
    if dida:
        type = dida_types[id]
        res_f.write(id+",")
    else:
        res_f.write("du"+id + ",")

    c1 = c[1]
   # print(c1)
    c2 = c[2]
    c = c1.split("/")
    if len(c) > 1:
        v11 = c[0]
        v12 = c[1]
        fv11 = annotate(",".join(v11.split(",")[:-1]))
        fv12 = annotate(",".join(v12.split(",")[:-1]))[0]
    else:
        v11 = c1
        fv11 = annotate(",".join(v11.split(",")[:-1]))
        fv12 = default_c
    v1_a = [fv11[0], fv12, fv11[1], 1 if fv11[3] else 0]
    v1_p = fv11[4]
    res_f.write(",".join([str(x) for x in v1_a]) + ",")

    c = c2.split("/")
    if len(c) > 1:
        v21 = c[0]
        v22 = c[1]
        fv21 = annotate(",".join(v21.split(",")[:-1]))
        fv22 = annotate(",".join(v22.split(",")[:-1]))[0]
    else:
        v21 = c2
        fv21 = annotate(",".join(v21.split(",")[:-1]))
        fv22 = default_c
    v2_a = [fv21[0], fv22, fv21[1], 1 if fv11[3] else 0]
    v2_p = fv21[4]
    res_f.write(",".join([str(x) for x in v2_a]))
    pathway = "1" if len(set(v1_p).intersection(set(v2_p))) > 0 else "0"
    res_f.write(","+pathway+",")
    res_f.write(type + "\n")
        # print("v11 ", v11)

