# coding: utf-8
from sklearn.ensemble import RandomForestClassifier 
import numpy as np
import math
from sklearn.metrics import roc_curve, roc_auc_score, auc
import operator
import cPickle, math

#import matplotlib.pyplot as plt
#from scipy import interp

#DATA 

newset=cPickle.load(open("newset.cPickle","rb"))
labelDic=cPickle.load(open("labelDic.cPickle","rb"))
vectorDicGDIpair=cPickle.load(open("vectorDicNew.cPickle","rb"))

numAttributi=len(vectorDicGDIpair["dd001"])
ddList=vectorDicGDIpair.keys()

#Lista delle features corrispondenti, posizione x posizione (9 dimensioni): 

vettoriTrain=[]
classiTrain=[]

for i in ddList:
	vettoriTrain.append(vectorDicGDIpair[i])
	classiTrain.append(labelDic[i])
			
			
Forest = RandomForestClassifier(n_estimators = 100, criterion='gini', max_depth=10, min_samples_split=2, min_samples_leaf=2, bootstrap=True, n_jobs=1)

train = Forest.fit(vettoriTrain,classiTrain)
#cPickle.dump(train, open("train.cPickle","w"))


