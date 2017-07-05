"use strict";

// myQuery

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

// tween engine
