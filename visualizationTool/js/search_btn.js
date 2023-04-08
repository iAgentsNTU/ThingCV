const searchButton = document.getElementById('searchBtn');
const searchDialog = document.getElementById('searchDialog');
const displayObj = document.getElementById('displayObj');

console.log("btn.js loaded"); 

var objName = {};
const chooseObj = "";

const confirmBtn = document.getElementById("confirmBtn")
// FIXME: Call when process start with no reason
confirmBtn.addEventListener("click", build_tree(objName[document.getElementById("filterObj").value]));