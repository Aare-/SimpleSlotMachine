"use strict";

let canvasContainer = $("#gameCanvasContainer");
let canvas = $("#gameCanvas");

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

class NetEntGame extends Game {
    _awake() {
        super._awake();

        this.testSprite = this.createSprite("SYM1");
        this.testSprite.p = 0;

        this.testSprite2 = this.createSprite("SYM3");
        this.testSprite2.p = 0;

        this.testSprite.addChild(this.testSprite2);

        this.root.addChild(this.testSprite);
    }

    _update(dt) {
        super._update(dt);

        this.testSprite.p += dt;
        let transform = this.testSprite.transform;
        transform.pos =
            new Vec2(
                Math.sin(3.14 * this.testSprite.p) * 200 + this.canvas.width / 2,
                Math.cos(3.14 * this.testSprite.p) * 200 + this.canvas.height / 2
            );

        this.testSprite2.p -= dt * 0.5;
        transform = this.testSprite2.transform;
        transform.pos =
            new Vec2(
                Math.sin(3.14 * this.testSprite2.p) * 150,
                Math.cos(3.14 * this.testSprite2.p) * 150
            );
    }
}

// bind to events
window.addEventListener('resize', windowResizeEventListener, true);

// manually call resize the screen
loadAssets("img/assets.json")
    .then((assets) => {
        let context2d = canvas.getContext('2d');
        let game = new NetEntGame({
            fps: 60,
            canvas: canvas,
            context: context2d,
            assets: assets});
        game.awake();

        $.hide("#loadingScreen");
        $.show("#gameCanvasContainer");

        windowResizeEventListener();
    })
    .catch((error) => {
        console.log("Assets loading failed with error: "+error);
    });
