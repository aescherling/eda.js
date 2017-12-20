
// globally accessible data variables, primarily for debugging
var myData;
var myVar;

// create an svg - everything will be drawn on this
var svg = d3.select('#viz').append('svg')
	.attr('height', '400px')
	.attr('width', '400px');

// create a histogram group
var histogram = svg.append('g')
	.attr('id','histogram')
	.attr('transform','translate(100,100)');

// histogram.append('rect').attr('x',100).attr('y',100).attr('width',100).attr('height',100).attr('fill','black');

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
function updateHist(x) {

	var xMin = d3.min(x);
	var xMax = d3.max(x);

	// calculate the counts of the chosen variable using calcHist
	var bins = 10;
	var counts = calcHist(x, Math.floor(xMin), Math.ceil(xMax), bins)
	var stepSize = (Math.ceil(xMax) - Math.floor(xMin)) / bins;
	myVar = counts;

	// rescale/relabel x axis
	histScaleX = d3.scaleLinear().domain([Math.floor(xMin), Math.ceil(xMax)]).range([0, histWidth]);
	var barWidth = histScaleX(Math.floor(xMin) + stepSize);
	d3.select('.xAxis').remove();
	histogram.append('g')
  		.attr('class', 'axis xAxis')
  		.attr('transform', 'translate(0,' + histHeight + ')')
  		.call(d3.axisBottom(histScaleX).ticks(5));

  	// rescale/relabel y axis
	histScaleY = d3.scaleLinear().domain([0, Math.ceil(d3.max(counts))]).range([histHeight, 0]);
	d3.select('.yAxis').remove();
	histogram.append('g')
  		.attr('class', 'axis yAxis')
  		.call(d3.axisLeft(histScaleY).ticks(5));

    // create bars with height 0
	histogram.selectAll('.bar')
	    .data(counts)
	    .enter()
	    .append('rect')
	    .attr('class', 'bar')
	    .attr('width', barWidth)
	    .attr('height', 0)
	    .attr('x', function (d, i) {return i * barWidth})
	    .attr('y', histHeight)
	    .attr('fill', 'steelblue')
	    .attr('stroke', d3.rgb('steelblue').darker());

	// update bars
    d3.selectAll('.bar')
      .transition()
      .duration(100)
      .attr('height', function (d,i) {return histHeight - histScaleY(counts[i])})
      .attr('y', function (d,i) {return histScaleY(counts[i])});

} // end of updateHist()



// function for creating a variable selector
function makeSelector(id, data, variables) {
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
		.attr('transform', 'translate(105,350)');

	// add the line to the selector
	var path = selector.append('path')
      .datum(variables)
      .attr('d', line)
      .attr('style', 'fill: none; stroke: #000; stroke-width: 0.5px;');

    // dot shows the current time selection
    var dot = selector.append("circle")
        .attr('cx', x(0))
        .attr('cy', y(0))
        .attr("r", 5);

    // variable name
    var varName = selector.append("text")
    	.attr("x", 100)
    	.attr("y", -10)
    	.attr("text-anchor", "middle")
    	.attr("text", "");

    function mousemove() {
    	var i = Math.min(Math.round(x.invert(d3.mouse(this)[0])), variables.length-1);
    	dot.attr('cx', x(i)).attr('cy', y(i));
    	varName.text(variables[i]);

    	// update the histogram to view the selected variable
    	var newVar = data.map(function(d) {return d[variables[i]]});
		updateHist(newVar);
    }

    selector.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .attr("style", "fill: none; pointer-events: all;")
        .on("mousemove", mousemove);


	// selector.append('rect').attr('x',0).attr('y',0).attr('width',10).attr('height',10).attr('fill','black');


} // end of makeSelector();



// when the data have loaded, explore!
queue()
  .defer(d3.csv, 'myData.csv')
  .await(explore);


// function to plot the data
function explore(error, data) {
	if (error) throw error;

	// get a list of the variable names
	var varNames = Object.keys(data[0]);

	// create crossfilter
	var cf = crossfilter(data);

	// default to selecting the first column of the csv
	// later the user will be able to try all the different variables
	var x = data.map(function(d) {return d[varNames[0]]});
	updateHist(x);

    // create a toolbar for switching the variable
    var selector = makeSelector('selector1', data, varNames);


} // end of explore







