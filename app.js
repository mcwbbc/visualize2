'use strict';

var ez_ui = require('./ezUI');

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
        ez_ui.openEzView(window.$(this).val());
    });

    chooser.trigger('click');
}

module.exports = {
    buttonFunctions: buttonFunctions
}