import cPickle, math
vectorDicGDIpair=cPickle.load(open("vectorDicGDIpair.cPickle","rb"))


x=(open("tmpFile","r")).readlines()


IDs=[]
for i in x:
	IDs.append(i.strip())
#print vectorDicGDIpair.keys()


for i in vectorDicGDIpair.keys():
	if i not in IDs:
		print i
