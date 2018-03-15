tmp=(open("tmp.txt","r")).readlines()

TP=0
TN=0
FP=0
FN=0

for i in tmp:
	tmp2=i.split("\t")
	real= tmp2[0]
	pred=tmp2[1][1:3]
	
	if real=="CO" and pred=="CO":
		TP += 1
	if real=="CO" and pred=="TD":
		FN += 1
	if real=="TD" and pred=="TD":
		TN += 1
	if real=="TD" and pred=="CO":
		FP += 1

print TP+TN+FP+FN


#37 48 17 17
