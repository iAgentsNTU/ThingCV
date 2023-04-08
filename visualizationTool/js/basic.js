var decay = 0.8;
function spreading(node_list, visited, visited_full, energy_threshold) {

    var parent, obj, depth, energy;
    node_list.forEach(function (obj_item) {
        parent = obj_item["parent"];
        obj = obj_item["obj"];
        depth = obj_item["depth"];
        energy = obj_item["energy"];


        if (obj in object_net && (visited.indexOf(obj) == -1)) {

            if (parent == "") {
                score = 1.0;
            } else {
                score = obj_item["score"];//object_net[parent][obj]*energy;
            }
            // console.log(obj_item);
            var ind = node_list.indexOf(obj_item)
            node_list.splice(ind, 1);

            visited.push(obj)
            visited_full.push({
                "parent": parent,
                "obj": obj,
                "depth": depth,
                "energy": energy,
                "score": score
            })


            var friend_list = [];

            for (var fri_obj in object_net[obj]) {
                // console.log(energy_threshold);
                if ((visited.indexOf(fri_obj) == -1) && (object_net[obj][fri_obj] * energy > energy_threshold)) {
                    node_list.push({
                        "parent": obj,
                        "obj": fri_obj,
                        "depth": depth + 1,
                        "energy": energy * decay,
                        "score": object_net[obj][fri_obj] * energy
                    });
                }
            }


            if ((node_list.length) > 0 && (depth <= 6)) {
                spreading(node_list, visited, visited_full, energy_threshold)
            } else {
                return []
            }
        }

    });

    return visited_full;
}

function build_tree(value) {
    console.log("build and switch to tree view");
    // var value = objName[document.getElementById("filterObj").value];

    var target_node = d3.select("#node_" + value);
    if (target_node.attr("class") == "nodeBt active") {
        d3.selectAll(".nodeBt").classed("active", false);
        d3.select('#treeSVG').select("svg").remove();
        d3.select("#globalSVG").style("display", "block");
        d3.select("#status").text("back to ego").attr("class", "statusBox");
        view_mode = 0;
    } else {
        d3.select("#globalSVG").transition().style("display", "none");
        d3.select("#treeSVG").style("display", "block");
        d3.selectAll(".nodeBt").classed("active", false);
        target_node.attr("class", "nodeBt active");
        d3.select("#status").text("back to social").attr("class", "statusBox");
        view_mode = 1;

        var list = []
        list.push({
            "parent": "",
            "obj": node_name[value],
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

    // console.log(target_node);

}

function getTreeData(data) {
    //turn data into treedata

    var treeData = {};
    var dataMap = data.reduce(function (map, node) {
        if (!(node.obj in map))
            map[node.obj] = {
                "parent": node.parent,
                "name": node.obj,
                "id": node.obj,
                "score": node.score,
                "depth": node.depth
            };
        return map;
    }, {});


    for (var node in dataMap) {
        var parent = dataMap[node].parent;
        if (parent) {
            if ("children" in dataMap[parent]) {
                dataMap[parent]["children"].push(dataMap[node]);
            } else {
                dataMap[parent]["children"] = [dataMap[node]];
            }

        } else {
            treeData = dataMap[node];
        }

    }

    return treeData;
}

var curve = function (context) {
    var custom = d3.curveLinear(context);
    custom._context = context;
    custom.point = function (x, y) {
        x = +x, y = +y;
        switch (this._point) {
            case 0: this._point = 1;
                this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
                this.x0 = x; this.y0 = y;
                break;
            case 1: this._point = 2;
            default:
                if (Math.abs(this.x0 - x) > Math.abs(this.y0 - y)) {
                    var x1 = this.x0 * 0.5 + x * 0.5;
                    this._context.bezierCurveTo(x1, this.y0, x1, y, x, y);
                }
                else {
                    var y1 = this.y0 * 0.5 + y * 0.5;
                    this._context.bezierCurveTo(this.x0, y1, x, y1, x, y);
                }
                this.x0 = x; this.y0 = y;
                break;
        }
    }
    return custom;
}

function treeVis(t_data) {
    // console.log(t_data);
    d3.select('#treeSVG').select("svg").remove();
    var tree_svg = d3.select("#treeSVG").append("svg");

    tt_data = d3.hierarchy(t_data);
    const root = tree(tt_data);

    tree_svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1.5)
        .selectAll("path")
        .data(root.links())
        .enter().append("path")
        .attr("d", d3.linkRadial()
            .angle(d => d.x)
            .radius(d => d.y));

    tree_svg.append("g").selectAll("circle")
        .data(root.descendants()).enter()
        .append("circle")
        .attr("transform", d => `
                rotate(${d.x * 180 / Math.PI - 90})
                translate(${d.y},0)
            `)
        .style('fill', function (d) {
            return linearColor(d.depth);
        })
        .attr("r", 10);

    tree_svg.append("g").attr("font-family", "sans-serif")
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 3)
        .selectAll("text")
        .data(root.descendants()).enter()
        .append("text")
        .style("font-size", "40px")
        .attr("transform", d => `
                rotate(${d.x * 180 / Math.PI - 90}) 
                translate(${d.y},0) 
                rotate(${-d.x * 180 / Math.PI + 90})
            `).attr("dy", "0.31em")
        .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
        .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
        .text(function (d) { return d.data.id; });

    return tree_svg.attr("viewBox", autoBox).attr('width', '700px');
}

// function globalVis(g_data){
//     // console.log(t_data);
//     d3.select('#globalSVG').select("svg").remove();
//     var global_svg = d3.select("#globalSVG").append("svg");

//     gg_data = d3.hierarchy(g_data);
//     const root = tree(tt_data);  

//     global_svg.append("g")
//             .attr("fill", "none")
//             .attr("stroke", "#555")
//             .attr("stroke-opacity", 0.4)
//             .attr("stroke-width", 1.5)
//         .selectAll("path")
//         .data(root.links())
//         .enter().append("path")
//         .attr("d", d3.linkRadial()
//                     .angle(d => d.x)
//                     .radius(d => d.y));

//     global_svg.append("g").selectAll("circle")
//         .data(root.descendants()).enter()
//         .append("circle")
//             .attr("transform", d => `
//                 rotate(${d.x * 180 / Math.PI - 90})
//                 translate(${d.y},0)
//             `)
//             .style('fill', function (d) {
//                 return linearColor(d.depth);
//             })
//             .attr("r", 4);

//     global_svg.append("g").attr("font-family", "sans-serif")
//             .attr("font-size", 10)
//             .attr("stroke-linejoin", "round")
//             .attr("stroke-width", 3)
//         .selectAll("text")
//         .data(root.descendants()).enter()
//         .append("text")
//             .attr("transform", d => `
//                 rotate(${d.x * 180 / Math.PI - 90}) 
//                 translate(${d.y},0) 
//                 rotate(${d.x >= Math.PI ? 180 : 0})
//             `).attr("dy", "0.31em")
//             .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
//             .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
//             .text(function (d) { return d.data.id; });


//     return global_svg.attr("viewBox", autoBox).attr('width', '700px');

// }


function autoBox() {
    document.body.appendChild(this);
    const { x, y, width, height } = this.getBBox();
    document.body.removeChild(this);

    return [x, y, width, height];
}

