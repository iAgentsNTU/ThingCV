function graph_init(file) {

    // get correct file to recommend input
    fetch(file, { mode: "no-cors" }) // disable CORS because path does not contain http(s)
        .then((res) => res.json())
        .then((data) => {
            objName = {};
            for (var i in data["nodes"]) {
                objName[data["nodes"][i]["id"]] = i;
            }
            // console.log(Object.keys(objName));  
            // console.log(objName);  
            $("#filterObj").autocomplete({
                source: Object.keys(objName),
                select: function (event, ui) {
                    build_tree(objName[ui.item.value])
                }
            });
        });
    
    document.getElementById('filterObj').value = '';

    // we have to refresh svg when change theme
    if (document.getElementById("globalSVG").innerHTML != "") {
        d3.select("#globalSVG").style("display", "block");
        d3.select("#treeSVG").style("display", "none");
        document.getElementById("globalSVG").innerHTML = "";
    }
    var svg = d3.select("#globalSVG").append("svg")
        .attr("width", width)
        .attr("height", height);
    var links_g = svg.append("g");
    var nodes_g = svg.append("g");

    console.log("read file: " + file)
    d3.json(file, function (error, graph) {
        if (error) throw error;

        $("#filterObj").autocomplete({
            source: Object.keys(objName),
            select: function (event, ui) {
                build_tree(objName[ui.item.value])
            }
        });

        function getByValue(map, searchValue) {
            for (let [key, value] of map.entries()) {
                if (value.id === searchValue)
                    return value.i;
            }
        }

        //--------------------------------------------------------------

        slider.append("g")
            .attr("transform", "translate(" + 0 + "," + 7 + ")")
            .attr("class", "y axis")
            .call(d3.svg.axis()
                .scale(x)
                .tickFormat(function (d) { return d; })
                .tickSize(0)
                .tickPadding(12))
            .select(".domain")
            .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
            .attr("class", "halo");

        slider.selectAll(".extent,.resize")
            .remove();

        var init_data = function () {
            graph.links.forEach(function (d, i) {
                d.i = i;
            });

            //clear up nodeArea
            d3.select('#nodeArea').html("");

            graph.nodes.forEach(function (d, i) {
                var nodeArea = d3.select('#nodeArea').append('div').attr("id", "node_" + i).attr("class", "nodeBt")
                    .text(d.id)
                    .on("click", function (d) {

                        console.log("click block");
                        console.log(this);

                        if (this.className == "nodeBt active") {
                            d3.select("#status").text("").classed("statusBox", false);
                            d3.selectAll(".nodeBt").classed("active", false);
                            d3.select('#treeSVG').select("svg").remove();
                            d3.select("#globalSVG").style("display", "block");
                            view_mode = 0;
                        } else { //show ego-view
                            view_mode = 1;
                            d3.select("#status").text("back to social view").attr("class", "statusBox");
                            d3.select("#globalSVG").transition().style("display", "none");
                            d3.select("#treeSVG").style("display", "block");
                            d3.selectAll(".nodeBt").classed("active", false);
                            this.className = "nodeBt active";

                            list = []
                            list.push({
                                "parent": "",
                                "obj": node_name[i],
                                "depth": 0,
                                "energy": 1.0
                            });

                            console.log(list);

                            group = spreading(list, [], [], 0.05);

                            console.log(group);
                            if (group.length > 1) {
                                var t_data = getTreeData(group);
                                a = treeVis(t_data);
                                d3.select("#treeSVG").node().append(a.node());
                            } else {
                                d3.select('#treeSVG').select("svg").remove();
                            }
                        }

                    });

                d.i = i;
                node_data.push(i);
                node_name[i] = d.id;
            });
        }

        init_data();

        d3.select("#status").on("click", function () {
            console.log("click ego/social");

            if (view_mode == 1 && d3.selectAll(".nodeBt.active")[0].length) {
                d3.select("#globalSVG").style("display", "block");
                d3.select("#treeSVG").style("display", "none");
                d3.select("#status").text("back to ego view").attr("class", "statusBox");
                view_mode = 0;

            } else if (view_mode == 0 && d3.selectAll(".nodeBt.active")[0].length) {
                d3.select("#globalSVG").style("display", "none");
                d3.select("#treeSVG").style("display", "block");
                d3.select("#status").text("back to soical view").attr("class", "statusBox");
                view_mode = 1;
            }
        });

        function brushed() {
            updateNode();

            var value = brush.extent()[0];
            d3.select("#threshold span").text(value);

            if (d3.event.sourceEvent) {
                // value = x.invert(d3.mouse(this)[1]);
                value = x.invert(d3.mouse(this)[0]);
                brush.extent([value, value]);
            }

            handle.attr("cx", x(value));
            var threshold = value;

            var nodeHash = {};
            var edgeHash = {};
            tree_data = [];
            edge_data = [];
            node_data = [];
            node_data2 = [];
            edge_data2 = [];
            community_data = [];

            object_net = {}
            graph.nodes.forEach(function (d, i) {
                node_data.push(d.i);
                object_net[d.id] = {};
            });

            graph.links.forEach(function (d, i) {
                ///------------------
                if (d.weight > threshold && d.target != d.source) {
                    edge_data.push({
                        "source": d.source,
                        "target": d.target,
                        "weight": d.weight
                    });

                    if (!(node_name[d.source] in object_net[node_name[d.source]])) {
                        object_net[node_name[d.source]][node_name[d.target]] = d.weight;
                    }

                    if (!nodeHash[d.source]) {
                        nodeHash[d.source] = { id: "" + d.source, label: "" + d.source };
                        node_data2.push(nodeHash[d.source]);
                    }
                    if (!nodeHash[d.target]) {
                        nodeHash[d.target] = { id: "" + d.target, label: "" + d.target };
                        node_data2.push(nodeHash[d.target]);
                    }
                    edge_data2.push({ id: nodeHash[d.source].id + "-" + nodeHash[d.target].id, source: nodeHash[d.source], target: nodeHash[d.target], weight: d.weight });
                }

            });

            var community = jLouvain().nodes(node_data).edges(edge_data);
            original_node_data = d3.entries(node_data);

            //Communnity detection
            var community_assignment_result = community();
            var node_ids = Object.keys(community_assignment_result);

            community_results = {};
            var max_community_number = 0;
            node_ids.forEach(function (d) {
                var community_id = community_assignment_result[d];
                if (community_id in community_results) {
                    community_results[community_id].push(d);
                } else {
                    community_results[community_id] = [d];
                }

                original_node_data[d].community = community_id;

                max_community_number = max_community_number < community_assignment_result[d] ?
                    community_assignment_result[d] : max_community_number;
            });

            // var color = d3.scale.category20().domain(d3.range([0, max_community_number]));

            //update nodeBt style
            if (node_ids.length) {
                node_ids.forEach(function (d) {
                    var colorValue = original_node_data[d].community / max_community_number;
                    var nodeColor = d3.select("#node_" + d).style("background-color", colorScale(colorValue));

                    if (colorValue > 0.37 && colorValue < 0.7) {
                        nodeColor.style("color", "rgb(8, 29, 88)");
                    } else {
                        nodeColor.style("color", "#fff");
                    }

                });
            }
            else {
                d3.selectAll(".nodeBt").style("background-color", "#fff").style("color", "#555");
            }

            var target_node = d3.select(".nodeBt.active");
            if (target_node[0][0]) {
                list = []
                list.push({
                    "parent": "",
                    "obj": node_name[parseInt(target_node[0][0].id.split("_")[1])],
                    "depth": 0,
                    "energy": 1.0
                });

                group = spreading(list, [], [], 0.05);

                if (group.length > 1) {
                    var t_data = getTreeData(group);
                    a = treeVis(t_data);
                    d3.select("#treeSVG").node().append(a.node());
                } else {
                    d3.select('#treeSVG').select("svg").remove();
                }
            }

            nodes_g.selectAll('.node')
                .data(original_node_data)
                .style('fill', function (d) {
                    return colorScale(d.community / max_community_number);
                });

            updateEdge();
        }

        /************* function updateNode() *************/
        function updateNode() {

            node.remove();

            force
                .nodes(graph.nodes);

            node = nodes_g.selectAll(".node")
                .data(graph.nodes).enter().append("g")
                .on("click", function (d) {
                    build_tree(d.index)

                })
                .on("mouseover", function () {
                    d3.select(this).select("text")
                        .transition().duration(100)
                        .attr('x', 10)
                        .attr('y', 6)
                        .style("font-size", font_size_node + 8);
                    d3.select(this).select("circle")
                        .transition()
                        .duration(100)
                        .attr("r", node_size_global + 3);
                })
                .on("mouseout", function () {
                    d3.select(this).select("text")
                        .transition().duration(100)
                        .attr('x', 6)
                        .attr('y', 3)
                        .style("font-size", font_size_node);
                    d3.select(this).select("circle").transition()
                        .duration(100)
                        .attr("r", node_size_global);
                })
                .call(force.drag);;


            node.append("circle")
                .attr("class", "node")
                .attr("r", node_size_global)
                .style("fill", '#ff3399')
                .call(force.drag);

            node.append("text")
                .text(function (d) {
                    return d.id
                })
                .attr('x', 6)
                .attr('y', 3)
                .style("font-size", font_size_node);

        }

        /************* function updateEdge() *************/
        function updateEdge() {
            link.remove();
            var max_weight = d3.max(edge_data, function (d) {
                return d.weight
            });
            var weight_scale = d3.scale.linear().domain([0, max_weight]).range([1, 5]);

            force
                .links(edge_data);


            link = links_g.selectAll(".link")
                .data(edge_data);

            link.enter().append("line")
                .attr("class", "link")
                .style("stroke-width", function (d) { return weight_scale(d.weight); });

            link.exit().remove();

            force.on("tick", function () {
                link.attr("x1", function (d) { return d.source.x; })
                    .attr("y1", function (d) { return d.source.y; })
                    .attr("x2", function (d) { return d.target.x; })
                    .attr("y2", function (d) { return d.target.y; });

                node.attr("transform", function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                })
            });

            force.start();
        }
        var node = nodes_g.selectAll(".node");
        var link = links_g.selectAll(".link");

        brush.on("brush", brushed);

        slider
            .call(brush.extent([5, 5]))
            .call(brush.event);

    });
}