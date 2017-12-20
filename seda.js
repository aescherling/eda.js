
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


// globally accessible data variables, primarily for debugging
var myData;
var myVar;


// when the data have loaded, explore!
queue()
  .defer(d3.csv, 'myData.csv')
  .await(explore)


// d3.csv("myData.csv", function(data) {
// 	myData = data;
// });

// function to plot the data
function explore(error, data) {
	if (error) throw error;

	// create crossfilter
	var cf = crossfilter(data);

	// for the test version, parse y variable from the test data
	// in the actual version, the variable will be selected by the user
	var y = data.map(function(d) {return d.y});
	var yMin = d3.min(y);
	var yMax = d3.max(y);

	// calculate the counts of the chosen variable using calcHist
	var bins = 10;
	var counts = calcHist(y, Math.floor(yMin), Math.ceil(yMax), bins)
	var stepSize = (Math.ceil(yMax) - Math.floor(yMin)) / bins;
	myVar = counts;

	// rescale/relabel x axis
	histScaleX = d3.scaleLinear().domain([Math.floor(yMin), Math.ceil(yMax)]).range([0, histWidth]);
	var barWidth = histScaleX(Math.floor(yMin) + stepSize);
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
      .duration(200)
      .attr('height', function (d,i) {return histHeight - histScaleY(counts[i])})
      .attr('y', function (d,i) {return histScaleY(counts[i])});

} // end of explore







