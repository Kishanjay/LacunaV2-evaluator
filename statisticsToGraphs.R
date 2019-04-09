library(ggplot2)

stats <- read.csv(file="./statistics.csv",head=TRUE,sep=",")

stats$precision <- with(stats, TrueDeadFunctions / ClaimedDeadFunctions)
stats$recall <- with(stats, TrueDeadFunctions / DeadFunctions)
stats$fscore <- with(stats, 2 * ((precision * recall)/(precision + recall)))


longByPR <- reshape(stats, direction="long", varying=c('precision', 'recall'), v.names="Value", 
                    idvar=c("ID"), timevar="Measure") 

longByPR$Measure <- as.factor(longByPR$Measure)
levels(longByPR$Measure)[levels(longByPR$Measure)=="1"] <- "Precision"
levels(longByPR$Measure)[levels(longByPR$Measure)=="2"] <- "Recall"


fontSize <- 10

ggplot(data=stats, aes(x=Analyzer, y=fscore)) +
  geom_boxplot() +
  coord_cartesian(ylim = c(0, 1)) + 
  stat_summary(fun.y=mean, geom="point", shape=5, size=2) + 
  theme_linedraw() +
  xlab("Analysis Technique") + ylab("F-score") +
  scale_x_discrete(limits=c("dynamic","static","hybrid"), labels=c("Dynamic", "Static", "Hybrid")) + 
  theme(axis.text=element_text(size=fontSize), axis.title=element_text(size=fontSize))
ggsave("./fscore.png", scale = 0.5, height = 10, unit = "cm")

# Boxplot of precision and recall per analysis type
ggplot(data=longByPR, aes(x=Analyzer, y=Value,fill=Measure)) +
  geom_boxplot(position=position_dodge(0.8), outlier.size = 0.5) +
  coord_cartesian(ylim = c(0, 1)) + 
  #stat_summary(fun.y=mean, geom="point", shape=5, size=1) + 
  theme_linedraw() +
  guides(fill=guide_legend(title="Metric")) + 
  xlab("Analysis Technique") + ylab("Precision and recall") +
  scale_x_discrete(limits=c("dynamic","static","hybrid"), labels=c("Dynamic", "Static", "Hybrid")) + 
  theme(axis.text=element_text(size=fontSize), axis.title=element_text(size=fontSize), legend.text=element_text(size=fontSize), legend.title=element_text(size=fontSize))
ggsave("./precision_recall.png", scale = 0.5, height = 10, unit = "cm")
