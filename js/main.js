"use strict";

let canvasContainer = $("#gameCanvasContainer");
let canvas = $("#gameCanvas");
let context2d = canvas.getContext('2d');

function windowResizeEventListener() {
    canvas.width = canvasContainer.clientWidth;
    canvas.height = canvasContainer.clientHeight;
}

function loadAssets(assetsConfig) {
    return $.ajax(assetsConfig)
     .then((payload) => {
         return new Promise(function(resolve, reject) {
             let assetDescription = JSON.parse(payload);

             // prepare assets loading promise array
             let assetLoadPromise =
                 assetDescription.map(function(assetDesc) {
                    return new Promise(function(resolve, reject) {
                        let image = new Image();

                        image.onload = function() {
                            // check if image loaded properly
                            if (image.width + image.height === 0) {
                                reject(`Error while loading image ${assetDesc.path}`);
                                return;
                            }

                            resolve({"id" : assetDesc.id, "img" : image});
                        };
                        image.onerror = function() {
                            reject(`Could not find image with path: ${assetDesc.path}`);
                        };

                        image.src = assetDesc.path;
                    });
                 });

             resolve(assetLoadPromise);
         });
     })
     .then((assetLoading) =>{
         // load all images
         return Promise.all(assetLoading);
     })
     .then((loadedImages) => {
         // map assets to hash map
         return new Promise((resolve, reject) => {
             let assets = {};

             loadedImages.map(
                 (imgDef) => { assets[imgDef.id] = imgDef.img; });

             resolve(assets);
         });
     });
}

// bind to events
window.addEventListener('resize', windowResizeEventListener, true);

// manually call resize the screen
windowResizeEventListener();
loadAssets("img/assets.json")
    .then((assets) => {
        console.log("Assets loaded");

        //TODO: start
    })
    .catch((error) => {
        console.log("Assets loading failed with error: "+error);
    });;
