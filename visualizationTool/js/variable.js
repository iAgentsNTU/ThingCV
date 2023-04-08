var input_file = "./data/youbike.json";

var width = 1200, height = 610;

var colorScale = d3.scaleSequential(t => d3.interpolateSpectral(t).toString());

// var color = d3.scale.category20();
var linearColor = d3.scale.linear().domain([0, 3, 8]).range(["#ED117D", "#FFCCE5", "#FDECF4"]);

var radius = width / 2;
var font_size_node = 14;
var node_size_global = 5;
var node_size_tree = 10;

var tree = d3.tree()
    .size([2 * Math.PI, radius])
    .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

var force = d3.layout.force()
    .charge(-120)
    .linkDistance(function (d) { return (1.0 / d.weight * 12); })
    // .linkDistance(10)
    .linkStrength(0.7)
    .size([width, height]);

var x = d3.scale.linear()
    .domain([0.005, 1])
    .range([270, 10])
    .clamp(true);

var brush = d3.svg.brush()
    .x(x)
    .extent([0, 0]);

var thresholded_links;
var node_data = [];
var edge_data = [];
var original_node_data = [];

var node_data2 = [];
var edge_data2 = [];
var node_name = {};

var list = []

var group; // = spreading(list, [], [], 0.05);

var object_net = {};
var community_results = {};

var view_mode = 0;

var slider = d3.select("#sliderSVG").append("svg").append("g")
    .attr("class", "slider")
    .call(brush);

var handle = slider.append("circle")
    .attr("class", "handle")
    .attr("transform", "translate(" + 0 + "," + 7 + ")")
    .attr("r", 5);

var root = {};