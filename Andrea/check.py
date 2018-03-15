import cPickle


labelDic=cPickle.load(open("labelDic.cPickle","rb"))
vectorDicGDIpair=cPickle.load(open("vectorDicNew.cPickle","rb"))

line=""


out=open("TrainingDataset.csv","w")
out.write("DIDA id, DEO1, DEO2, RecA, EssA, DEO3, DEO4, RecB, EssB, Path, Class\n")

for i in labelDic.keys():
	line += str(i)+", "
	for e in vectorDicGDIpair[i]:
		line+= str(e)+", "
	line += str(labelDic[i])+"\n"
	out.write(line)
	
	
out.close()
