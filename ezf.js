'use strict';

var zip = require('adm-zip');
var xml = require('pixl-xml');
var fs = require('fs');
var protein_js = {};
var scan_js = {};

function readEz2(file){
    var ez2 = new zip(file);
    var zipEntries = ez2.getEntries();

    zipEntries.forEach(function(entry){
        //console.log(entry.toString());
        if(entry.entryName == 'protein_summary.xml'){
            var json = undefined;
            var text = ez2.readAsText('protein_summary.xml','utf8');
            json = xml.parse(text );

            fs.writeFile('./test.json', JSON.stringify(json), function(err){
                if(err){ return console.log(err);}
            });
            saveProteins(json);
            //console.log(JSON.stringify(json));
        }
        if(entry.entryName == 'scans.xml'){
            var json = undefined;
            var text = ez2.readAsText('scans.xml','utf8');
            json = xml.parse(text );

            fs.writeFile('./scans.json', JSON.stringify(json), function(err){
                if(err){ return console.log(err);}
            });
            saveScans(json);
            //console.log(JSON.stringify(json));
        }
    });
    //return json;
}

function saveProteins(json){
    window.localStorage.clear();
    //window.localStorage.setItem('proteins', JSON.stringify(json));
    var new_js = {};
    window.$.each(json, function(){
        new_js[this.accession] = updatePep2Scan(this);

    });
    //window.localStorage.setItem('proteins', JSON.stringify(new_js));
    protein_js = new_js;
}

function saveScans(json){
    //window.localStorage.setItem('scans', '');
    var new_js = {};
    window.$.each(json, function(){
        new_js[this.raw_name] = this;

    });
    //window.localStorage.setItem('scans', JSON.stringify(new_js));
    scan_js = new_js;
}

function getProteins(){
    return protein_js;
    //return JSON.parse(window.localStorage.getItem('proteins'));
}

function getPeptides(protein){
    var json = getProteins();
    var peptides = [];
    window.$.each(json[protein].pep2scan, function(seq, val){
        peptides.push(seq);
    })
    return peptides;

}

function listAllPeptides(protein){
    var json = getProteins();
    //console.log("peptides: " + JSON.stringify(json));
    var peptides = json[protein].peptides;
     if( typeof peptides === 'string'){
     peptides = [peptides];
     }
     return peptides;
}

function getScans(protein, sequence){
    var json = getProteins();
    var scans = [];
    window.$.each(json[protein].pep2scan[sequence], function(index, val){
        if(index == 'sequence'){

        } else {
            scans.push(val);
        }
    });
    return scans;
}

function getProteinDetails(protein){
    return protein_js[protein];
}

function getScanDetails(scan){
    return scan_js[scan];
}

function updatePep2Scan(json){
    var new_pep2scan = {};
    window.$.each(json.pep2scan, function(index, val){
       new_pep2scan[val.sequence] = val;
    });
    json.pep2scan = new_pep2scan;
    return json;
}

module.exports = {
    readEz2: readEz2,
    getProteins: getProteins,
    getPeptides: getPeptides,
    getScans: getScans,
    getProteinDetails: getProteinDetails,
    getScanDetails: getScanDetails,
    listAllPeptides: listAllPeptides
};