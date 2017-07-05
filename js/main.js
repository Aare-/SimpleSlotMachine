"use strict";

let canvasContainer = $("#gameCanvasContainer");
let canvas = $("#gameCanvas");
let game;

function windowResizeEventListener() {
    canvas.width = canvasContainer.clientWidth;
    canvas.height = canvasContainer.clientHeight;

    // game scaling
    if(game) {
        let scaleY = canvas.height / game.root.size.y;
        let scaleX = scaleY;

        game.root.transform.scale = new Vec2(scaleX, scaleY);

        game.root.transform.pos =
            new Vec2(
                (canvas.width - game.root.size.x * scaleX) / 2,
                (canvas.height - game.root.size.y * scaleY) / 2
            );
    }
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

class Spinner extends Sprite {
    constructor(game) {
        super(game.assets);

        this.symbols = [
            "SYM1",
            "SYM3",
            "SYM4",
            "SYM5",
            "SYM6",
            "SYM7"
        ];
        this.slowDown = true;
        this.spinning = false;

        this.spinDecreaseSpeed = 6;
        this.triggerFinalSpinAtSpeed = 0.2;

        this.symbol = Math.floor(Math.random() * this.symbols.length);
        this.randNewSymbol();
    }

    set symbol(value) {
        this._symbol = value;
        this.img = this.symbols[value];
    }

    get symbol() {
        return this._symbol;
    }

    randNewSymbol() {
        let oldSymbol = this.symbol;
        while(oldSymbol === this.symbol) {
            this.symbol = Math.floor(Math.random() * this.symbols.length);
        }
    }

    startSpin(delay = 0) {
        this.delay = delay;
        this.spinDuration = 0;
        this.spinValue = 0;
        this.slowDown = false;
        this.spinning = true;
        this.spinSpeed = 18.0 + Math.random() * 6.0;
        this.delayBeforeSpeedDecrease = 1.0+ Math.random() * 1.0;
    }

    updateSpin(dt) {
        if(this.delay > 0) {
            this.delay -= dt;
            return;
        }

        this.spinDuration += dt;
        let newSpinSpeed = this.spinSpeed;

        if(this.spinDuration > this.delayBeforeSpeedDecrease) {
            newSpinSpeed = Math.max(this.triggerFinalSpinAtSpeed, newSpinSpeed - this.spinDecreaseSpeed * dt);
        }

        if(!this.slowDown && newSpinSpeed <= this.triggerFinalSpinAtSpeed) {
            this.slowDown = true;
        }

        if(this.slowDown) {
            // tweening to final value
            this.transform.scale.y *= 1.2;

            if(Math.abs(this.transform.scale.y) > 1) {
                this.transform.scale.y = Math.round(this.transform.scale.y);
                this.spinning = false;
            }
        } else {
            // regular spinning
            this.spinValue += dt * newSpinSpeed;
            this.spinSpeed = newSpinSpeed;
            let prevScaleVal = this.transform.scale.y;
            let newScaleVal = Math.sin(this.spinValue);

            if(Math.sign(newScaleVal) !== Math.sign(prevScaleVal)) {
                this.randNewSymbol();
            }

            this.transform.scale = new Vec2(1, newScaleVal);
        }
    }
}

class NetEntGame extends Game {
    _awake() {
        super._awake();

        this.isSpinning = false;
        this.canSpin = true;

        // create background
        let background = this.createSprite("BG");
        background.anchorPos = new Vec2(0, 0);
        background.size = new Vec2(this.root.size.x, this.root.size.y);

        // create spin board
        let spinBoard = new Node();
        spinBoard.transform.pos = new Vec2(70, 27);
        spinBoard.size = new Vec2(717, 536 - spinBoard.transform.pos.y * 2);

        // create spin button
        this.spinButton = this.createSprite("BTN_Spin");
        this.spinButton.transform.pos = new Vec2(873, 267);
        this.spinButton.clickCallback = () => {
            this.startSpin();
        };

        // create bet lines
        for(let i = 0; i < 3; i++) {
            let betLine = this.createSprite("Bet_Line");
            betLine.transform.pos = new Vec2(
                spinBoard.size.x / 2,
                155 / 2 + i * (155 + 8));
            betLine.size = new Vec2(betLine.size.x - 70, betLine.size.y);

            spinBoard.addChild(betLine);
        }

        // create spinners
        this.spinners = [];
        for(let i = 0; i < 9; i++) {
            let spinner = new Spinner(this);
            spinner.size = new Vec2(233, 155);
            spinner.transform.pos = new Vec2(
                233 / 2 + (i % 3 ) * (8 + 233),
                155 / 2 + Math.floor(i / 3) * (155 + 8));

            spinBoard.addChild(spinner);
            this.spinners.push(spinner);
        }

        // add all elements to scene
        this.root.addChild(background);
        this.root.addChild(spinBoard);
        this.root.addChild(this.spinButton);
    }

    startSpin() {
        if(!this.canSpin) return;
        if(this.isSpinning) return;

        this.isSpinning = true;
        this.canSpin = false;

        this.spinButton.img = "BTN_Spin_d";

        let i = 0;
        for(var spinner of this.spinners) {
            // add small delay starting from the left corner
            spinner.startSpin(((i % 3) + Math.floor(i / 3)) * 0.1);
            i++;
        }
    }

    _update(dt) {
        super._update(dt);

        // performing spin
        if(this.isSpinning) {
            let isSpinning = false;

            for (let spinner of this.spinners) {
                isSpinning = isSpinning || spinner.spinning;
                spinner.updateSpin(dt);
            }

            if(!isSpinning) {
                this.isSpinning = false;
                this._handleSpinResult();
            }
        }
    }

    _handleSpinResult() {
        //check lines for matching symbols
        let matchFound = false;
        let patterns = [
            // horizontal
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],

            // vertical
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],

            //diagonal
            [0, 4, 8],
            [2, 4, 6]
        ];
        let scheduledForFlash = {};

        // searching for matching patterns
        for(let pattern of patterns) {
            if(this.spinners[pattern[0]].symbol !== this.spinners[pattern[1]].symbol ||
               this.spinners[pattern[1]].symbol !== this.spinners[pattern[2]].symbol) {
                continue;
            }

            // match found, schedyle for a flash
            for(var i = 0; i < 3; i++) {
                scheduledForFlash[pattern[i]] = true;
            }

            matchFound = true;
        }

        // flashing what has been found as a match
        for(let key in scheduledForFlash) {
            let spinner = this.spinners[key];
            let p = 0;

            // flash animation
            this.tEngine.registerTween(
                new Tween(
                    () => { return p; },
                    (v) => {
                        p = v;
                        spinner.visible = Math.floor(p) % 2 === 0;
                    },
                    6, 1.0, InterpLinear
                ));
        }

        this.tEngine.registerTween(
            new Tween(
                () => { return 0; },
                (v) => {}, 1,
                matchFound ? 1.0 : 0.0,
                InterpLinear,
                () => {
                    this.spinButton.img = "BTN_Spin";
                    this.canSpin = true;
                }));
    }
}

// bind to events
window.addEventListener('resize', windowResizeEventListener, true);

// manually call resize the screen
loadAssets("img/assets.json")
    .then((assets) => {
        let context2d = canvas.getContext('2d');
        game = new NetEntGame({
            fps: 30,
            canvas: canvas,
            context: context2d,
            assets: assets,
            width: 960,
            height: 536});
        game.awake();

        $.hide("#loadingScreen");
        $.show("#gameCanvasContainer");

        windowResizeEventListener();
    })
    .catch((error) => {
        console.log("Assets loading failed with error: "+error);
    });
