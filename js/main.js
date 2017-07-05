"use strict";

let canvasContainer = $("#gameCanvasContainer");
let canvas = $("#gameCanvas");
let context2d = canvas.getContext('2d');

function windowResizeEventListener() {

    canvas.width = canvasContainer.clientWidth;
    canvas.height = canvasContainer.clientHeight;
}

function loadAssets() {
    $.ajax("img/assets.json")
     .then((result) => {
         return new Promise(function(result, reject) {
             console.log("Ajax request succeded with: "+result.response);
             let assetDescription = JSON.parse(result.response);

             
         });
     })
     .then(() =>{

     })
     .catch((error) => {
        console.log("Ajax request failed "+error.xmlhttp.status);
     });
}

// bind to events
window.addEventListener('resize', windowResizeEventListener, true);

// manually call resize the screen
windowResizeEventListener();
loadAssets();
