tmp=(open("labels.txt","r")).readlines()
tmp1=(open("lista.txt","r")).readlines()
tmp2=(open("multipred.txt","r")).readlines()
import cPickle

vectorDicGDIpair=cPickle.load(open("vectorDicNew.cPickle","rb"))
labelDic=cPickle.load(open("labelDic.cPickle","rb"))

multipred={}

orderedlist=[]

for i in tmp1:
	key=i.strip()
	multipred[key]=[]
	orderedlist.append(key)



for i in tmp2:
	predictions=i[:-1].split(",")

	for i in range (0,len(orderedlist)):
		tmpkey=orderedlist[i]
		tmppred=predictions[i]
		multipred[tmpkey].append(tmppred)
		
newmulti={}
for i in multipred:
	TDnum=multipred[i].count("TD")
	COnum=multipred[i].count("CO")
	
	if TDnum>COnum:
		newmulti[i]="TD ("+str(TDnum)+"%)"
	else:
		newmulti[i]="CO ("+str(COnum)+"%)"
	


output=open("TrainingDataset.csv","w")


for i in orderedlist:
	
	line=i+", "
	
	for e in vectorDicGDIpair[i]:
		line=line+str(e)+", "
	
	line=line+str(labelDic[i])+", "+newmulti[i]

	output.write(line+"\n")
	
	


"""

for i in range (0,len(tmp1)):
	key=tmp1[i].strip()
	multipred[key]=[]
	
	print len(tmp2[i][:-1].split(","))

	
print multipred
"""
