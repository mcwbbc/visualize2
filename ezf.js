'use strict';

var zip = require('adm-zip');
var xml = require('pixl-xml');
var fs = require('fs');
var protein_js = {};
var scan_js = {};
var fasta_js = {};

function readEz2(file){
    var ez2 = new zip(file);
    var zipEntries = ez2.getEntries();

    zipEntries.forEach(function(entry){
        if(entry.entryName == 'protein_summary.xml'){
            var json = undefined;
            var text = ez2.readAsText('protein_summary.xml','utf8');
            json = xml.parse(text );

            fs.writeFile('./test.json', JSON.stringify(json), function(err){
                if(err){ return console.log(err);}
            });
            saveProteins(json);
        }
        if(entry.entryName == 'scans.xml'){
            var json = undefined;
            var text = ez2.readAsText('scans.xml','utf8');
            json = xml.parse(text );

            fs.writeFile('./test.scans.json', JSON.stringify(json), function(err){
                if(err){ return console.log(err);}
            });
            saveScans(json);
            //console.log(JSON.stringify(json));
        }
        if(entry.entryName == 'fasta.xml'){
            var json = undefined;
            var text = ez2.readAsText('fasta.xml','utf8');
            json = xml.parse(text );

            fs.writeFile('./test.fasta.json', JSON.stringify(json), function(err){
                if(err){ return console.log(err);}
            });
            saveFasta(json);
        }
    });
}

function saveProteins(json){
    window.localStorage.clear();
    var new_js = {};
    window.$.each(json, function(){
        new_js[this.accession] = updatePep2Scan(this);
        //backwards compatability
        if(isNaN(this.protein_prob)){ this.protein_prob = this.protein_prophet}

    });
    protein_js = new_js;
}

function saveScans(json){
    //window.localStorage.setItem('scans', '');
    var new_js = {};
    window.$.each(json, function(){
        new_js[this.raw_name] = this;

    });
    scan_js = new_js;
}

function saveFasta(json){
    var new_js = {};
    window.$.each(json, function(){
        new_js[this.accession] = this;
    });
    fasta_js = new_js;
}

function getProteins(){
    return protein_js;
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
    var peptides = json[protein].peptides;
     if( typeof peptides === 'string'){
     peptides = [peptides];
     }
     return peptides.sort();
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

function getFasta(protein){
    var seq_array = fasta_js[protein].sequence.split('');
    var seq = '';
    while(seq_array.length >= 50 ){
        seq += seq_array.splice(0,50).join('') + "<br />";
    }
    seq += seq_array.join('') + "<br />";
    return ['>', protein, '|', fasta_js[protein].name, '|', fasta_js[protein].description].join(" ") + "<br />" +
            seq;
}

function calculateCoverage(protein){
    var seq_map = [];
    var seq_count = 0;
    //return empty if no sequence
    if(typeof fasta_js[protein] === 'undefined'){ return {"coverage": 0, "observed": 0, "total": 0  };}
    window.$.each(getPeptides(protein), function(i, val){
        var pat = RegExp(val, 'igm');
        var res = pat.exec(fasta_js[protein].sequence);
        if(res === null){return {};} //return empty if no match
        for(var i = 0; i < val.length; i++){
            seq_map[res.index + i] = 1;
        }
    });
    window.$.each(seq_map, function(i,v){ seq_count += (v || 0); })
    return {"coverage": seq_count / fasta_js[protein].sequence.length,
            "observed": seq_count,
            "total": fasta_js[protein].sequence.length  }

}

function getProteinDetails(protein){
    return protein_js[protein];
}

function getScanDetails(scan){
    //added for backwards compatability
    if(isNaN(scan_js[scan].peptide_prob)){ scan_js[scan].peptide_prob = scan_js[scan].peptide_prophet}
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
    listAllPeptides: listAllPeptides,
    getFasta: getFasta,
    calculateCoverage: calculateCoverage
};