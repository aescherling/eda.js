// load data

var myData;
var myVar;

// wait until all the data is loaded before proceeding
queue()
  .defer(d3.csv, 'myData.csv')
  .await(data_ready)


// d3.csv("myData.csv", function(data) {
// 	myData = data;
// });

function data_ready(error, data) {
	if (error) throw error;

	// create crossfilter
	var cf = crossfilter(data);

	// create an svg
	var svg = d3.select('#viz').append('svg')
		.attr('height', '400px')
		.attr('width', '400px');

	// create a histogram
	var hist_group = svg.append('g')
		.attr('id','hist_group')
		.attr('transform','translate(100,100)');

	// histogram dimensions
	var histHeight = 200;
	var histWidth = 200;

	// draw axes of histogram
	// default to (0,1) scale
	y_scale = d3.scaleLinear().domain([0,1]).range([histHeight, 0]);
	hist_group.append('g')
	  .attr('class', 'axis yAxis')
	  .call(d3.axisLeft(y_scale).ticks(5));

	x_scale = d3.scaleLinear().domain([0,1]).range([0, histWidth]);
	hist_group.append('g')
	  .attr('class', 'axis xAxis')
	  .attr('transform', 'translate(0,' + histHeight + ')')
	  .call(d3.axisBottom(x_scale).ticks(5));

	// function for calculating the counts necessary for producing a histogram
	// input: data, lower end of lowest bin, high end of highest bin, desired # of bins
	// output: JS object with variable "value" = count for each bin
	calcHist = function (x, low, high, bins) {
	  // scale the data & take floor to collapse into bins
	  histScale = d3.scaleLinear().domain([low, high]).range([0,bins]);
	  scaled = x.map(function(a) {return Math.floor(histScale(a));});

    	// find the # of points in each bin
    	hist = Array(bins);
    	for (i=0; i < hist.length; i++){
    	  bool = scaled.map(function (a) {return (a == i);});
    	  val = d3.sum(bool);
    	  hist[i] = val;
    	}

  	  return hist;
  	}

	var y = data.map(function(d) {return d.y});
	myVar = y;

	var bins = 10;
	histScaleX = d3.scaleLinear().domain([0, bins]).range([0, histWidth]);
	hist_group.selectAll('.xBar')
	    .data(y)
	    .enter()
	    .append('rect')
	    .attr('class', 'xBar')
	    .attr('width', histScaleX(1))
	    .attr('height', 0)
	    .attr('x', function (d, i) {return i * histScaleX(1)})
	    .attr('y', histHeight)
	    .attr('fill', 'steelblue')
	    .attr('stroke', d3.rgb('steelblue').darker());

	// // update x axis histogram
 //  graph.selectAll('.xDot')
 //    .each(function (d,i) {
 //      myData = xHistData[i];

 //      d3.selectAll('.xBar')
 //        .transition()
 //        .delay(tt * i)
 //        .attr('height', function (dd, ii) {return myData[ii]})
 //        .attr('y', function (dd, ii) {return xHistHeight - myData[ii]});

 //      xMax = d3.max(xHistArray[i]);
 //      scale = d3.scaleLinear().domain([0,xMax]).range([xHistHeight, 0]);
 //      xHist.selectAll('g').filter('.yAxis')
 //        .transition()
 //        .delay(tt * i)
 //        .call(d3.axisLeft(scale).ticks(5));    
 //    })

} // end of data_ready



// hist_group.append('rect').attr('x',100).attr('y',100).attr('width',100).attr('height',100).attr('fill','black');




