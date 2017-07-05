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

class Transform {
    constructor() {
        this.pos = new Vec2();
        this.scale = new Vec2(1, 1);
        this.rot = new Vec3();
    }

    // returns immutable transform object
    combine(transform) {
        let newTransform = new Transform();

        newTransform.pos = this.pos.add(transform.pos);
        newTransform.scale = this.scale.mul(transform.scale);
        newTransform.rot = this.rot.add(transform.rot);

        return newTransform;
    }
}

class Node {
    constructor() {
        this.children = [];
        this.transform = new Transform();
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

    _renderSelf(context2d, transform) { }
}

class Sprite extends Node {
    constructor(assets, imgId = null) {
        super();

        this.assets = assets;
        this.size = new Vec2();
        this.anchorPos = new Vec2(0.5, 0.5);
        this._img = null;
        this._imgId = null;

        if(imgId !== null)
            this.img = imgId;
    }

    set img(image) {
        this._imgId = image;
        this._img = this.assets[image];
        this.size.x = this._img.width;
        this.size.y = this._img.height;
    }

    get img() {
        return this._imgId;
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
}

class Game {
    constructor(parameters) {
        this.targetFPS = parameters.fps;
        this.context2d = parameters.context;
        this.assets = parameters.assets;
        this.canvas = parameters.canvas;
        this.lastFrameTime = Date.now() / 1000.0;
        this.root = new Node();
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
