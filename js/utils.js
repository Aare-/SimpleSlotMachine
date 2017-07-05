"use strict";

/*****************
 **** myQuery ****
 *****************/

let $ = function( elementToFind, scope = document ) {
    return $.find(elementToFind, scope);
};

$.find = function(elementToFind, scope = document) {
    if(!elementToFind || 0 === elementToFind.length) {
        return null;
    }

    // search by class
    if(elementToFind.startsWith(".")) {
        let token = elementToFind.substring(1);
        return scope.getElementsByClassName(token);
    }

    // search by id
    if(elementToFind.startsWith("#")) {
        let token = elementToFind.substring(1);
        return scope.getElementById(token);
    }

    return scope.getElementsByName(elementToFind);
};

$.ajax = function(adress) {
    return new Promise(function(resolve, reject) {
        let xmlhttp = new XMLHttpRequest();

        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState !== XMLHttpRequest.DONE ) return;

            switch(xmlhttp.status) {
                case 200:
                    resolve(xmlhttp.responseText);
                    break;
                case 400:
                    reject(`Error ${xmlhttp.status}`);
                    break;
                default:
                    reject(`Error ${xmlhttp.status}`);
                    break;
            }
        };

        xmlhttp.open("GET", adress, true);
        xmlhttp.send();
    });
};

$.show = function(elementToFind) {
    let element = $.find(elementToFind);
    element.classList.remove("hidden");
};

$.hide = function(elementToFind) {
    let element = $.find(elementToFind);
    element.classList.add("hidden");
};

/*****************************
 **** Minimal Game Engine ****
 *****************************/

class Vec2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    //returns immutable vector
    add(vec) { return new Vec2(this.x + vec.x, this.y + vec.y); }

    //returns immutable vector
    mul(vec) { return new Vec2(this.x * vec.x, this.y * vec.y); }
}

class Vec3 extends Vec2 {
    constructor(x = 0, y = 0, z = 0) {
        super(x, y);
        this.z = z;
    }

    //returns immutable vector
    add(vec) { return new Vec3(this.x + vec.x, this.y + vec.y, this.z + vec.z); }

    //returns immutable vector
    mul(vec) { return new Vec3(this.x * vec.x, this.y * vec.y, this.z * vec.z); }
}

class Rect {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    contains(x, y) {
        return this.x <= x && x <= this.x + this.w && this.y <= y && y <= this.y + this.h;
    }
}

class Transform {
    constructor() {
        this.pos = new Vec2();
        this.scale = new Vec2(1, 1);
        this.rot = new Vec3();
    }

    // returns immutable transform object
    combine(transform) {
        let newTransform = new Transform();

        newTransform.pos = this.pos.mul(transform.scale).add(transform.pos);
        newTransform.scale = this.scale.mul(transform.scale);
        newTransform.rot = this.rot.add(transform.rot);

        return newTransform;
    }
}

class Node {
    constructor() {
        this.children = [];
        this.size = new Vec2();
        this.transform = new Transform();
        this.clickCallback = null;
    }

    addChild(node) {
        this.children.push(node);
    }

    render(context2d, parentTransform = new Transform()) {
        let transform = this.transform.combine(parentTransform);

        this._renderSelf(context2d, transform);

        for(let child of this.children) {
            child.render(context2d, transform);
        }
    }

    click(mousePos, parentTransform = new Transform()) {
        let transform = this.transform.combine(parentTransform);
        let size = this.size.mul(transform.scale);
        let rect = new Rect(transform.pos.x, transform.pos.y, size.x, size.y);

        if(rect.contains(mousePos.x, mousePos.y) && this.clickCallback !== null) {
            this.clickCallback(mousePos);
        }

        for(let child of this.children) {
            child.click(mousePos, transform);
        }
    }

    _renderSelf(context2d, transform) { }
}

class Sprite extends Node {

    set img(image) {
        if(!(image in this.assets )) {
            throw `Could not finr ${image} in loaded assets`;
        }
        this._imgId = image;
        this._img = this.assets[image];

        // only change size if not initiated
        if(this.size.x + this.size.y == 0) {
            this.size.x = this._img.width;
            this.size.y = this._img.height;
        }
    }

    get img() {
        return this._imgId;
    }

    constructor(assets, imgId = null) {
        super();

        this.assets = assets;
        this.anchorPos = new Vec2(0.5, 0.5);
        this._img = null;
        this._imgId = null;

        if(imgId !== null)
            this.img = imgId;
    }

    _renderSelf(context2d, transform) {
        let actSizeX = this.size.x * transform.scale.x;
        let actSizeY = this.size.y * transform.scale.y;

        context2d.drawImage(
            this._img,
            transform.pos.x - actSizeX * this.anchorPos.x,
            transform.pos.y - actSizeY * this.anchorPos.y,
            actSizeX,
            actSizeY);
    }

    click(mousePos, parentTransform = new Transform()) {
        let transform = this.transform.combine(parentTransform);
        let size = this.size.mul(transform.scale);
        let rect = new Rect(
            transform.pos.x - this.anchorPos.x * size.x,
            transform.pos.y - this.anchorPos.y * size.y,
            size.x, size.y);

        if(rect.contains(mousePos.x, mousePos.y) && this.clickCallback !== null) {
            this.clickCallback(mousePos);
        }

        for(let child of this.children) {
            child.click(mousePos, transform);
        }
    }
}

class Game {
    constructor(parameters) {
        this.targetFPS = parameters.fps;
        this.context2d = parameters.context;
        this.assets = parameters.assets;
        this.canvas = parameters.canvas;
        this.lastFrameTime = Date.now() / 1000.0;
        this.root = new Node();
        this.root.size = new Vec2(parameters.width, parameters.height);

        //binding input
        this.canvas.addEventListener("mousedown", this._mouseDown.bind(this), false);
    }

    _mouseDown(e) {
        let mousePos = this._getMousePos(e);
        this.root.click(mousePos);
    }

    _getMousePos(mouseEvent) {
        let rect = this.canvas.getBoundingClientRect();

        let x = (mouseEvent.clientX - rect.left);
        let y = (mouseEvent.clientY - rect.top);

        return { x: x, y: y };
    }

    _mainLoop() {
        let currentTime = Date.now() / 1000.0;
        let deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        this._update(deltaTime);
        this._draw(deltaTime);
    }

    awake() {
        this._awake();
        setInterval(
            this._mainLoop.bind(this),
            1000 / this.targetFPS);
    }

    createSprite(imgId) {
        return new Sprite(this.assets, imgId);
    }

    _draw(dt) {
        // clean frame
        this.context2d.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.root.render(this.context2d);
    }

    _awake() { }

    _update(dt) { }
}

/******************************
 **** Minimal Tween Engine ****
 ******************************/
/*
class Tween {
    constructor(from, to, time, interp, setter, callback) {
        this.from = from;
        this.to = to;
        this.time = time;
        this.interp = interp
        this.setter =
    }

    update(dt) {

    }
}

class TweenEngine {
    // interpolators
    get Linear() {
        return function(x) {
            return x;
        }
    }

    get Sine() {
        return function(x) {
            return
        }
    }

    constructor() {
        this.tweens = [];
    }

    update(dt) {
        this.tweens.filter(function(tween) {
            tween.update(dt);
            return tween.progress
        });

        for(let t of this.tweens) {
            t.update(dt);


        }
    }
}
*/
