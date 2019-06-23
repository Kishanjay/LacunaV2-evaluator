/**
 * @author Kishan Nirghin
 * 
 * @version 2
 * 
 * @description Generates the average statistics of the different analyser 
 * combinations
 */
require("./prototype_extension");

const fs = require("fs");
const path = require("path");
const csv = require("fast-csv");

const STATISTICS_FOLDER = "statistics";
const STATISTICS_OUTPUT = "_statistics.csv";


function parseStatistics() {
    fs.readdir(STATISTICS_FOLDER, function (err, files) {
        var results = {};
        files.forEach((file) => {
            if (file == STATISTICS_OUTPUT) { return; }

            var csv_file = fs.readFileSync(path.join(STATISTICS_FOLDER, file));
            var lines = csv_file.toString().split('\n');
            
            // skip first line
            lines.shift();
            lines.forEach((line) => {
                var lineData = line.split(",");
                if (!lineData) { return; }
                var key = lineData[0].replace(/ /g, "+");
                if (!key) { return; }
                
                var accuracy = lineData[8];
                var precision = lineData[9];
                var recall = lineData[10];
                var fscore = lineData[11];

                if (!results.hasOwnProperty(key)) {
                    results[key] = {
                        accuracy: [],
                        precision: [],
                        recall: [],
                        fscore: []
                    }
                }
                results[key].accuracy.push(accuracy);
                results[key].precision.push(precision);
                results[key].recall.push(recall);
                results[key].fscore.push(fscore);
            });
            
        });
        generateAverages(results);
    });
}
   
function generateAverages(results) {
    var csvData = "Analyzer,Accuracy,Precision,Recall,Fscore\n";
    for (var analyzer in results) {
        if (!results.hasOwnProperty(analyzer)) { continue; }
        var analyzerData = results[analyzer];
        var avgAccuracy = calculateAverage(analyzerData.accuracy).toFixed(2);
        var avgPrecision = calculateAverage(analyzerData.precision).toFixed(2);
        var avgRecall = calculateAverage(analyzerData.recall).toFixed(2);
        var avgFscore = calculateAverage(analyzerData.fscore).toFixed(2);
        csvData += `${analyzer},${avgAccuracy},${avgPrecision},${avgRecall},${avgFscore}\n`;
    }
    fs.writeFileSync(path.join(__dirname, STATISTICS_FOLDER, STATISTICS_OUTPUT), csvData, 'utf8');
}

function calculateAverage(arr) {
    if (!arr) { return null; }
    return sum(arr) / arr.length;
}

function sum(arr) { 
    var sum = 0;
    arr.forEach((item) => {
        sum += parseFloat(item);
    });
    return sum;
}
parseStatistics();
