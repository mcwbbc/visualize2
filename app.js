'use strict';

var ui = require('./userInterface');

function buttonFunctions(){
    window.$('#open').click(function(event){
        chooseFile('#fileDialog');
    });
    window.$('#quit').click(function(event){
        process.exit(0);
    });
}

function chooseFile(name){
    var chooser = window.$(name);
    chooser.unbind('change');
    chooser.change(function(event){
        console.log(window.$(this).val());
        ui.openEzView(window.$(this).val());
    });

    chooser.trigger('click');
}

module.exports = {
    buttonFunctions: buttonFunctions
}