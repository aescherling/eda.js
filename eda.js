// load data

var myData;

d3.csv("myData.csv", function(data) {
	myData = data;
});

// create crossfilter
// for some reason this throws an error...
// var cf = crossfilter(myData);

// create a histogram