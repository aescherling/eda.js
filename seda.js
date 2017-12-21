
// globally accessible data variables, primarily for debugging
var myData;
var myVar;

// create an svg - everything will be drawn on this
var svg = d3.select('#viz').append('svg')
	.attr('height', '400px')
	.attr('width', '700px');

// create a histogram group
var histogram = svg.append('g')
	.attr('id','histogram')
	.attr('transform','translate(100,100)');

// histogram dimensions
var histHeight = 200;
var histWidth = 200;

// draw axes of histogram
// default to (0,1) scale
y_scale = d3.scaleLinear().domain([0,1]).range([histHeight, 0]);
histogram.append('g')
  .attr('class', 'axis yAxis')
  .call(d3.axisLeft(y_scale).ticks(5));

x_scale = d3.scaleLinear().domain([0,1]).range([0, histWidth]);
histogram.append('g')
  .attr('class', 'axis xAxis')
  .attr('transform', 'translate(0,' + histHeight + ')')
  .call(d3.axisBottom(x_scale).ticks(5));

// create a scatterplot group
var scatterplot = svg.append('g')
	.attr('id', 'scatterplot')
	.attr('transform', 'translate(400, 100)');

// draw axes of scatterplot
scatterplot.append('g')
  .attr('class', 'axis yAxis')
  .call(d3.axisLeft(y_scale).ticks(5));

scatterplot.append('g')
  .attr('class', 'axis xAxis')
  .attr('transform', 'translate(0,' + histHeight + ')')
  .call(d3.axisBottom(x_scale).ticks(5));

// label the y axis of the scatterplot
scatterplot.append('text')
	.attr('id', 'yAxisLabel')
	.attr("x", -40)
    .attr("y", 100)
    .attr('transform','rotate(-90 -40,100)')
    .attr("text-anchor", "middle")
    .text("");


// function for calculating the counts necessary for producing a histogram
// input: data, lower end of lowest bin, high end of highest bin, desired # of bins
// output: JS object with variable "value" = count for each bin
function calcHist(x, low, high, bins) {
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


// function for updating the histogram with input variable (array) x
// also updates the y variable of the scatterplot
function updateHist(x) {

	myVar = x;

	var xMin = d3.min(x);
	var xMax = d3.max(x);

	// calculate the counts of the chosen variable using calcHist
	var bins = 10;
	var counts = calcHist(x, Math.floor(xMin), Math.ceil(xMax), bins);
	var stepSize = (Math.ceil(xMax) - Math.floor(xMin)) / bins;

	// rescale/relabel x axis of histogram
	histScaleX = d3.scaleLinear().domain([Math.floor(xMin), Math.ceil(xMax)]).range([0, histWidth]);
	d3.select('#histogram').select('.xAxis').call(d3.axisBottom(histScaleX).ticks(5));

  	// rescale/relabel y axis of histogram
	histScaleY = d3.scaleLinear().domain([0, Math.ceil(d3.max(counts))]).range([histHeight, 0]);
	d3.select('#histogram').select('.yAxis').call(d3.axisLeft(histScaleY).ticks(5));

	// update bars
    d3.selectAll('.bar')
      .transition()
      .duration(100)
      .attr('height', function (d,i) {return histHeight - histScaleY(counts[i])})
      .attr('y', function (d,i) {return histScaleY(counts[i])});


	// relabel y axis of scatterplot and update points
	scatterScaleY = d3.scaleLinear().domain([Math.floor(xMin), Math.ceil(xMax)]).range([histHeight, 0]);
	d3.select('#scatterplot').select('.yAxis').call(d3.axisLeft(scatterScaleY).ticks(5));
	d3.select('#scatterplot').selectAll('.point')
		.transition()
		.duration(100)
		.attr('cy', function(d,i) {return scatterScaleY(x[i])})
		.attr('stroke', 'black');

} // end of updateHist()


// function for updating the x variable of the scatterplot with input variable (array) x
function updateScatter(x) {

	var xMin = d3.min(x);
	var xMax = d3.max(x);

	// rescale/relabel x axis
	scatterScaleX = d3.scaleLinear().domain([Math.floor(xMin), Math.ceil(xMax)]).range([0, histWidth]);
	d3.select('#scatterplot').select('.xAxis').call(d3.axisBottom(scatterScaleX).ticks(5));

	// update points
	d3.selectAll('.point')
		.transition()
		.duration(100)
		.attr('cx', function(d,i) {return scatterScaleX(x[i])})
		.attr('fill', 'black');

} // end of updateHist()


// function for creating a variable selector
function makeSelector(id, data, variables, mousemove, transform) {
	// if a filter with this id already exists, remove it
	d3.selectAll('#' + id).remove();

	// set dimensions
    var width = 200;
    var height = 20;
    var textwidth = 55;
    var margin = 5;

	// create the scales
    var x = d3.scaleLinear()
    	.domain([0, variables.length-1])
    	.range([0, width - 2*margin]);

    var y = d3.scaleLinear()
    	.domain([0, variables.length-1])
    	.range([height/2, height/2]);

    // a line based on the scales
    var line = d3.line()
        .x(function(d, i) { return x(i); })
        .y(function(d, i) { return y(i); });

    // create a selector group
	var selector = svg.append('g')
		.attr('id', id)
		.attr('transform', transform);

	// add the line to the selector
	var path = selector.append('path')
      .datum(variables)
      .attr('d', line)
      .attr('style', 'fill: none; stroke: #000; stroke-width: 0.5px;');

    // dot shows the current variable selection
    var dot = selector.append("circle")
    	.attr('class', 'dot')
        .attr('cx', x(0))
        .attr('cy', y(0))
        .attr("r", 5);

    // variable name
    var varName = selector.append("text")
    	.attr("x", 100)
    	.attr("y", -10)
    	.attr("text-anchor", "middle")
    	.attr("text", "");

	// function for updating the histogram and y variable of scatterplot using the selector
	function moveHist() {
		var i = Math.min(Math.round(x.invert(d3.mouse(this)[0])), variables.length-1);
		dot.attr('cx', x(i)).attr('cy', y(i));
		varName.text(variables[i]);
		d3.select('#yAxisLabel').text(variables[i]);
	
		// update the histogram to view the selected variable
		var newVar = data.map(function(d) {return +d[variables[i]]});
		updateHist(newVar);
	}

	// function for updating the x variable of the scatterplot using the selector
	function moveScatter() {
		var i = Math.min(Math.round(x.invert(d3.mouse(this)[0])), variables.length-1);
		dot.attr('cx', x(i)).attr('cy', y(i));
		varName.text(variables[i]);
	
		// update the histogram to view the selected variable
		var newVar = data.map(function(d) {return +d[variables[i]]});
		updateScatter(newVar);
	}

    var overlay = selector.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .attr("style", "fill: none; pointer-events: all;");

    if (mousemove=="histogram") {
        overlay.on("mousemove", moveHist);
    } else if (mousemove=="scatterplot") {
    	overlay.on("mousemove", moveScatter);
    }

    return(selector);
} // end of makeSelector();



// when the data have loaded, explore!
// queue()
//   .defer(d3.csv, 'myData.csv')
//   .await(explore);

// alternatively, upload a file
// http://bl.ocks.org/syntagmatic/raw/3299303/
function upload_button(el, callback) {
  var uploader = document.getElementById(el);  
  var reader = new FileReader();

  reader.onload = function(e) {
    var contents = e.target.result;
    callback(contents);
  };

  uploader.addEventListener("change", handleFiles, false);  

  function handleFiles() {
    var file = this.files[0];
    reader.readAsText(file);
  };
};
upload_button('files', load_data);

// load dataset and explore!
function load_data(csv) {
  var data = d3.csvParse(csv);
  explore(data);
}

// function to plot the data
function explore(data) {
	// if (error) throw error;

	// get a list of the variable names
	var varNames = Object.keys(data[0]);

	// create crossfilter
	var cf = crossfilter(data);

	// add bars with height 0 to the histogram
	var bins = 10;
	var barWidth = histWidth / bins;
	d3.select('#histogram').selectAll('.bar')
	    .data(Array(bins))
	    .enter()
	    .append('rect')
	    .attr('class', 'bar')
	    .attr('width', barWidth)
	    .attr('height', 0)
	    .attr('x', function (d, i) {return i * barWidth})
	    .attr('y', histHeight)
	    .attr('fill', 'steelblue')
	    .attr('stroke', d3.rgb('steelblue').darker());

	// default to selecting the first column of the csv
	// later the user will be able to try all the different variables
	var y = data.map(function(d) {return +d[varNames[0]]});
	updateHist(y);

	// add points to the scatterplot
	d3.select('#scatterplot').selectAll(".point")
		.data(data)
		.enter().append("circle")
		.attr("class", "point")
		.attr("r", 3.5)
		.attr("cx", 0)
		.attr("cy", 0)
		.style("fill", "none");

	// default to selecting the second column of the csv
	var x = data.map(function(d) {return +d[varNames[1]]});
	updateScatter(x);

    // create a toolbar for switching the histogram variable (and y variable of scatterplot)
    var selector1 = makeSelector('selector1', data, varNames, 'histogram', 'translate(105,350)');

    // create a toolbar for switching the x variable of scatterplot
    var selector2 = makeSelector('selector2', data, varNames, 'scatterplot', 'translate(405,350)');


} // end of explore







