# coding: utf-8
from sklearn.ensemble import RandomForestClassifier 
import numpy as np
import math
from sklearn.metrics import roc_curve, roc_auc_score, auc
import operator
import cPickle, math

#import matplotlib.pyplot as plt
#from scipy import interp


def getScores(pred, real, threshold): ## pred= lista di lunghezza n=numero di istanza--> predizioni   real= stessa cosa ma valori reali  threshold= numero che definisce ciò che è positivo e ciò che è negativo nelle predizioni (es 0.5 --> tutto ciò che è superiore a 0.5 è positivo , altrimenti negativo)
	if len(pred) != len(real):
		raise Exception("ERROR: input vectors have differente len!")
	
	
	fpr, tpr, thresholds = roc_curve(real, pred)
	aucScore = roc_auc_score(real, pred)
	
	res = []
	i = 0
	assert len(fpr) == len(tpr) == len(thresholds)
	while i < len(fpr):
		res.append((fpr[i],tpr[i],thresholds[i]))
		i+=1
	
	threshold = sorted(res, key=lambda x:math.sqrt((0.0-x[0])**2+(1.0-x[1])**2))[0][2]

	saveThresh.append(threshold)
	#threshold=0.5
	#raw_input()
	#threshold = 0.5
	print "Best thr: " , threshold
	confusionMatrix = {}
	confusionMatrix["TP"] = confusionMatrix.get("TP", 0)
	confusionMatrix["FP"] = confusionMatrix.get("FP", 0)
	confusionMatrix["FN"] = confusionMatrix.get("FN", 0)
	confusionMatrix["TN"] = confusionMatrix.get("TN", 0)
	i = 0
	while i < len(real):
		if float(pred[i])<threshold and (real[i]==0):
			confusionMatrix["TN"] = confusionMatrix.get("TN", 0) + 1
		if float(pred[i])<threshold and real[i]==1:
			confusionMatrix["FN"] = confusionMatrix.get("FN", 0) + 1
		if float(pred[i])>threshold and real[i]==1:
			confusionMatrix["TP"] = confusionMatrix.get("TP", 0) + 1
		if float(pred[i])>threshold and real[i]==0:
			confusionMatrix["FP"] = confusionMatrix.get("FP", 0) + 1
		i += 1
	#print "--------------------------------------------"
	'''
	print "      | DEL         | NEUT             |"
	print "DEL   | TP: %d   | FP: %d  |" % (confusionMatrix["TP"], confusionMatrix["FP"] )
	print "NEUT  | FN: %d   | TN: %d  |" % (confusionMatrix["FN"], confusionMatrix["TN"])	
	'''

	
	sen = (confusionMatrix["TP"]/float((confusionMatrix["TP"] + confusionMatrix["FN"])))
	spe = (confusionMatrix["TN"]/float((confusionMatrix["TN"] + confusionMatrix["FP"])))
	acc =  (confusionMatrix["TP"] + confusionMatrix["TN"])/float((sum(confusionMatrix.values())))
	bac = (0.5*((confusionMatrix["TP"]/float((confusionMatrix["TP"] + confusionMatrix["FN"])))+(confusionMatrix["TN"]/float((confusionMatrix["TN"] + confusionMatrix["FP"])))))
	pre =(confusionMatrix["TP"]/float((confusionMatrix["TP"] + confusionMatrix["FP"])))
	mcc =	( ((confusionMatrix["TP"] * confusionMatrix["TN"])-(confusionMatrix["FN"] * confusionMatrix["FP"])) / math.sqrt((confusionMatrix["TP"]+confusionMatrix["FP"])*(confusionMatrix["TP"]+confusionMatrix["FN"])*(confusionMatrix["TN"]+confusionMatrix["FP"])*(confusionMatrix["TN"]+confusionMatrix["FN"])) )  
	#from sklearn.metrics import roc_curve, auc
	

	print "\nSen = %3.3f" % sen
	print "Spe = %3.3f" %  spe
	print "Acc = %3.3f " % acc
	print "Bac = %3.3f" %  bac	
	print "Pre = %3.3f" %  pre
	print "MCC = %3.3f" % mcc
	print "AUC = %3.3f" % aucScore
	print "--------------------------------------------"	

#	mean_tpr += interp(mean_fpr, fpr, tpr)
#	mean_tpr[0] = 0.0
	return [sen, spe, acc, bac, pre, mcc, aucScore]

#def per fare la cross validation stratificata per coppie di geni. L'input è sempre il solito, cioè i vari fold, l'output cambia 
#in quanto random forest 
	
	
def crossValidation(sets,vectorDic,labelDic,Forest,featureGlobal):

	featureGeneral=[]
	allLabel=[]
	allPred=[]

	for pair in sets:
		listaTest=sets[pair]
		listaTrain=ddList[:]
		for d in listaTest:
			listaTrain.remove(d)
		
		vettoriTrain=[]
		classiTrain=[]
		for i in listaTrain:
			vettoriTrain.append(vectorDic[i])
			classiTrain.append(labelDic[i])
				
		vettoriTest=[]
		classiTest=[]
		for i in listaTest:
			vettoriTest.append(vectorDic[i])
			classiTest.append(labelDic[i])
		
		
		train = Forest.fit(vettoriTrain,classiTrain)
		#cPickle.dump(train, open("train.cPickle","w"))
		features=train.feature_importances_.tolist()
		#pred contains the probability predictions for instances in test dataset
		pred=train.predict_proba(vettoriTest)
		PRED=[]

		for i in pred:
			PRED.append(i[1])
		 
		featureGlobal=map(sum, zip(featureGlobal,features))
		
		allPred += PRED
		allLabel += classiTest
	
	featureGlobal=map(lambda x: x/len(sets), featureGlobal)
	
	
	return (allPred,allLabel,featureGlobal)

def globalUpdate(scores):
	globSen.append(scores[0])
	globSpe.append(scores[1])
	globAcc.append(scores[2])
	globBac.append(scores[3])
	globPre.append(scores[4])
	globMcc.append(scores[5])
	globAucScore.append(scores[6])
	return  [globSen, globSpe, globAcc, globBac, globPre, globMcc, globAucScore]
	
def GlobalResults():
	
	print "Global performances over ", folds, "-times statified crossvalidation:\n"
	globsen=np.array(globSen)
	globspe=np.array(globSpe)
	globacc=np.array(globAcc)
	globbac=np.array(globBac)
	globpre=np.array(globPre)
	globmcc=np.array(globMcc)
	globaucScore=np.array(globAucScore)

	print "\nSen = %3.3f, standard deviation: %3.3f " % (np.mean(globsen),np.std(globsen))
	print "Spe = %3.3f, standard deviation: %3.3f " % (np.mean(globspe),np.std(globspe))
	print "Acc = %3.3f, standard deviation: %3.3f " % (np.mean(globacc),np.std(globacc))
	print "Bac = %3.3f, standard deviation: %3.3f " % (np.mean(globbac),np.std(globbac))
	print "Pre = %3.3f, standard deviation: %3.3f " % (np.mean(globpre),np.std(globpre))
	print "MCC = %3.3f, standard deviation: %3.3f " % (np.mean(globmcc),np.std(globmcc))
	print "AUC = %3.3f, standard deviation: %3.3f " % (np.mean(globaucScore),np.std(globaucScore))	
	
#	out.write("\nSen = %3.3f, standard deviation: %3.3f " % (np.mean(globsen),np.std(globsen)))
#	out.write("Spe = %3.3f, standard deviation: %3.3f " % (np.mean(globspe),np.std(globspe)))	
#	out.write("Acc = %3.3f, standard deviation: %3.3f " % (np.mean(globacc),np.std(globacc)))	
#	out.write("Bac = %3.3f, standard deviation: %3.3f " % (np.mean(globbac),np.std(globbac)))	
#	out.write("Pre = %3.3f, standard deviation: %3.3f " % (np.mean(globpre),np.std(globpre)))	
#	out.write("MCC = %3.3f, standard deviation: %3.3f " % (np.mean(globmcc),np.std(globmcc)))	
	return("AUC = %3.3f, standard deviation: %3.3f " % (np.mean(globaucScore),np.std(globaucScore)))



#DATA 

newset=cPickle.load(open("newset.cPickle","rb"))
labelDic=cPickle.load(open("labelDic.cPickle","rb"))
vectorDicGDIpair=cPickle.load(open("vectorDicNew.cPickle","rb"))

numAttributi=len(vectorDicGDIpair["dd001"])
ddList=vectorDicGDIpair.keys()


#Lista delle features corrispondenti, posizione x posizione (9 dimensioni): 

Features=["DEO1","DEO2","RecessA","EssA","DEO3","DEO4","RecessB","EssB","Pathway"]

#initializing performance scores, featureGlobal conservera' l'importanza media delle features x ogni crossvalidation, 
#featureGl sara' la media delle cross validation di tutti i folds
featureGlobal=[0.0] * numAttributi
globSen=[]
globSpe=[]
globAcc=[]
globBac=[]
globPre=[]
globMcc=[]
globAucScore=[]
featureGl=[0.0] * numAttributi


############### Random forest from here
folds=100
trees=100

#print len(vectorDicGDIpair.keys())

saveThresh=[]

def featureAnalysis (FeatureImportance):
	important_features = []
	featureNumber={}
	for x,i in enumerate(FeatureImportance):
		featureNumber[i]=str(x)
		if i>np.average(FeatureImportance):
			important_features.append(str(x))

	sort= sorted(featureNumber.keys())

	print 'Most important features:',', '.join(important_features),"\n"

	SortedFeatures=[]
	for i in sort:
		SortedFeatures.append(featureNumber[i])

	print 'Features in ascending order, from the less important to the more important',', '.join(SortedFeatures),"\n"
	
	
	
globalFeatureImportance=[0.0] * numAttributi

vectProva={}


for i in vectorDicGDIpair:
	DEO1=vectorDicGDIpair[i][0]
	DEO2=vectorDicGDIpair[i][1]
	tmp2=vectorDicGDIpair[i][2]
	tmp3=vectorDicGDIpair[i][3]
	DEO3=vectorDicGDIpair[i][4]
	DEO4=vectorDicGDIpair[i][5]
	tmp6=vectorDicGDIpair[i][6]
	tmp7=vectorDicGDIpair[i][7]
	tmp8=vectorDicGDIpair[i][8]

	if DEO1 == 2.0:
		tmp0= 0.0 
	else:
		tmp0=DEO1
		
	if DEO2 == 2.0:
		tmp1= 0.0
	else:
		tmp1=DEO2
		 
	if DEO3 == 2.0:
		tmp4= 0.0 
	else:
		tmp4=DEO3 
	
	if DEO4 == 2.0:
		tmp5= 0.0 
	else:
		tmp5=DEO4 

	newvect=[tmp0,tmp1,tmp4,tmp5]
	vectProva[i]=newvect




Forest = RandomForestClassifier(n_estimators = trees, criterion='gini', max_depth=10, min_samples_split=2, min_samples_leaf=2, bootstrap=True, n_jobs=1)
for i in range(0,folds):
	print i+1,"-fold:"
	res=crossValidation(newset,vectProva,labelDic,Forest,featureGlobal)
	
#	globalFeatureImportance=map(operator.add, globalFeatureImportance,res[2])

	#res[0] are the predictions, res[1] the actual labels,res[2] a vector representing the importance of each feature
	#getScores return [sen, spe, acc, bac, pre, mcc, aucScore].for the moment i put 0.5 as threshold in the mcc calculation
	scores=getScores(res[0], res[1], 0.5)
	#getScores1(res[0], res[1], 0.5)
	#store all the performances for each fold
	globalUpdate(scores)
	#store all the feature.importance index
#	featureGl=map(sum, zip(featureGl,res[2]))

#featureGl=map(lambda x: x/folds, featureGl)

#globalFeatureImportance = map(lambda x: x/folds, globalFeatureImportance)

result=GlobalResults()

#featureAnalysis (globalFeatureImportance) 
print "best tresh: "
print(sum(saveThresh) / len(saveThresh))


