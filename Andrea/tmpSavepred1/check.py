x=(open("pred.txt","r")).readlines()
out=open("PRED2.txt","w")
for i in x:
	n= float(i.strip())
	if n < 0.415896825397 :
		print "TD"
		out.write("TD\n")
	else:
		print "CO"
		out.write("CO\n")
