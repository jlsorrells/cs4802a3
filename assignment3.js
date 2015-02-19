
"use strict"

var margin = {top: 200, right: 10, bottom: 10, left: 10},
    width = 1800 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom;

var x = d3.scale.ordinal().rangePoints([0, width], 1),
    y = {},
    dragging = {};

var line = d3.svg.line(),
    axis = d3.svg.axis().orient("left"),
    background,
    foreground;

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
var dimensions;
var allData;
var re = /([A-z ]*) \((mean|standard error|max)\)/;

drawUI();

// parse the data, then draw the graph
d3.csv("wdbc.txt", function(error, data) {

    allData = data;

  // Extract the list of dimensions and create a scale for each.
  x.domain(dimensions = d3.keys(data[0]).filter(function(d) {
    return d != "ID" && d != "Diagnosis" && d.match(re)[2] == "mean" && 
        (y[d] = d3.scale.linear()
        .domain(d3.extent(data, function(p) { return +p[d]; }))
        .range([height, 0]));
  }));

  // Add greyer background lines for context.
  background = svg.append("g")
    .selectAll("path")
      .data(data)
    .enter().append("path")
      .attr("id", "data-line")
      .attr("d", path)
      .attr("stroke", function (d) { return d.Diagnosis == "B" ? "#5555AA" : "#AA5555"; })
      .attr("stroke-width", 1)
      .attr("fill", "none")
      .attr("opacity", .05);

  // Add blue/red foreground lines for focus.
  // color lines based on diagnosis
  var b = 0, m = 0;
  foreground = svg.append("g")
    .selectAll("path")
      .data(data)
    .enter().append("path")
      .attr("id", "data-line")
      .attr("d", path)
      .attr("stroke", function (d) { return d.Diagnosis == "B" ? (b++, "blue") : (m++, "red"); })
      .attr("stroke-width", 2)
      .attr("fill", "none")
      .attr("opacity", .1);

    updateCounter(b, m);
    updateDimensions();
});

function position(d) {
  var v = dragging[d];
  return v == null ? x(d) : v;
}

function transition(g) {
  return g.transition().duration(500);
}

// Returns the path for a given data point.
function path(d) {
  return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
}

function brushstart() {
  d3.event.sourceEvent.stopPropagation();
}

// Handles a brush event, toggling the display of foreground lines.
function brush() {
  var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
      extents = actives.map(function(p) { return y[p].brush.extent(); });
  var bVisible = 0;
  var mVisible = 0;
  foreground.style("display", function(d) {
    var result = actives.every(function(p, i) {
      return extents[i][0] <= d[p] && d[p] <= extents[i][1];
    }) ? null : "none";
    // keep track of how many lines are visible
    if (result == null) {
        if (d.Diagnosis == "B") {
            bVisible++;
        } else {
            mVisible++;
        }
    }
    return result;
  });
  updateCounter(bVisible, mVisible);
}

// updates the lines and redraws the axes
function updateDimensions() {
    x.domain(dimensions)();
    svg.selectAll("#data-line").transition()
        .duration(1000)
        .attr("d", path);
        
    // dimensions
    var g = svg.selectAll("#dimension").remove();

    // Add a group element for each dimension.
    var g = svg.selectAll("#dimension")
      .data(dimensions)
    .enter().append("g")
      .attr("id", "dimension")
      .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
      .call(d3.behavior.drag()
        .origin(function(d) { return {x: x(d)}; })
        .on("dragstart", function(d) {
          dragging[d] = x(d);
          background.attr("visibility", "hidden");
        })
        .on("drag", function(d) {
          dragging[d] = Math.min(width, Math.max(0, d3.event.x));
          foreground.attr("d", path);
          dimensions.sort(function(a, b) { return position(a) - position(b); });
          x.domain(dimensions);
          g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
        })
        .on("dragend", function(d) {
          delete dragging[d];
          transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
          transition(foreground).attr("d", path);
          background
              .attr("d", path)
            .transition()
              .delay(500)
              .duration(0)
              .attr("visibility", null);
        }));

  // Add an axis and title.
  g.append("g")
      .attr("id", "axis-title")
      .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
    .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(function(d) { return d.match(re)[1]; });

  // Add and store a brush for each axis.
  g.append("g")
      .each(function(d) {
        d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
      })
    .selectAll("rect")
      .attr("x", -8)
      .attr("width", 16);
}

// filters the dimensions: "mean", "max", or "standard error"
function dimensionMatch(m) {
    var newDims = [];
    for (var i = 0; i < dimensions.length; i++) {
        newDims.push(d3.keys(allData[0]).filter(function (d) { 
            return d.match(re) && d.match(re)[1] == dimensions[i].match(re)[1] && d.match(re)[2] == m;
        })[0]);
    }
    dimensions = newDims;
    for (var i = 0; i < dimensions.length; i++) {
        (y[dimensions[i]] = d3.scale.linear()
        .domain(d3.extent(allData, function(p) { return +p[dimensions[i]]; }))
        .range([height, 0]));
    }
    updateDimensions();
}

function drawUI() {
    var ui = d3.select("svg")
        .append("g")
        .attr("id", "ui");
        
    // title
    ui.append("text")
        .attr("x", 80)
        .attr("y", 30)
        .attr("font-size", "30px")
        .text("Cell Nuclei Characteristics and Breast Cancer Diagnosis");
        
    // key
    var keybox = ui.append("g")
        .attr("transform", "translate(100,70)");
    keybox.append("text")
        .attr("x", 50)
        .attr("y", 20)
        .attr("font-size", "20px")
        .text("Malignant");
    keybox.append("text")
        .attr("x", 50)
        .attr("y", 45)
        .attr("font-size", "20px")
        .text("Benign");
    keybox.append("rect")
        .attr("x", 0)
        .attr("y", 13)
        .attr("width", 40)
        .attr("height", 2)
        .attr("fill", "red")
    keybox.append("rect")
        .attr("x", 0)
        .attr("y", 37)
        .attr("width", 40)
        .attr("height", 2)
        .attr("fill", "blue")
    
    // data type picker
    ui.append("foreignObject")
        .attr("x", 400)
        .attr("y", 80)
        .attr("width", 200)
        .attr("height", 50)
        .html("<select onchange='dimensionMatch(this.value)'>\
            <option value='mean'>Average Value</option>\
            <option value='max'>Maximum Value</option>\
            <option value='standard error'>Standard Error</option>\
            </select>");
            
    // benign/malignant counter
    var counter = ui.append("g")
        .attr("transform", "translate(600,90)");
    counter.append("text")
        .attr("id", "counter-text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("font-size", "20px")
        .text("0 records shown: 0 benign, 0 malignant");
}

function updateCounter(b, m) {
    d3.select("#counter-text")
        .text((b + m) + " records shown: " + b + " benign, " + m + " malignant");
}





