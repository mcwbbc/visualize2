'use strict';

var zip = require('adm-zip'); //used for reading zip
var archiver = require('archiver'); //used for writing zip
var xml = require('pixl-xml');
var fs = require('fs');
var tools = require('./sequenceTools');
var ez2;
var protein_js = {};
var scan_js = {};
var fasta_js = {};
var params_js = {};

// Initialize
function readEz2(file){
    ez2 = new zip(file);
    var zipEntries = ez2.getEntries();

    //list of files in zip
    var file_names = [];
    zipEntries.forEach(function(entry){
        file_names.push(entry.entryName);
    });

    if(file_names.indexOf('protein_summary.xml') > -1){
        var json = undefined;
        if(file_names.indexOf('protein_summary.json') > -1){
            var text = ez2.readAsText('protein_summary.json','utf8');
            json = JSON.parse(text);
        } else {
            var text = ez2.readAsText('protein_summary.xml','utf8');
            json = xml.parse(text);
        }


        fs.writeFile('./test.json', JSON.stringify(json), function(err){
            if(err){ return console.log(err);}
        });
        saveProteins(json);
        fs.writeFile('./test.updated.json', JSON.stringify(protein_js), function(err){
            if(err){ return console.log(err);}
        });
    }

    if(file_names.indexOf('scans.xml') > -1){
        var json = undefined;
        /*if(file_names.indexOf('scans.json') > -1){
            var text = ez2.readAsText('scans.json','utf8');
            json = JSON.parse(text );
        } else {*/
            var text = ez2.readAsText('scans.xml','utf8');
            json = xml.parse(text );
        //}

        fs.writeFile('./test.scans.json', JSON.stringify(json), function(err){
            if(err){ return console.log(err);}
        });
        saveScans(json);
    }

    if(file_names.indexOf('fasta.xml') > -1){
        var json = undefined;

        if(file_names.indexOf('fasta.json') > -1){
            var text = ez2.readAsText('fasta.json','utf8');
            json = JSON.parse(text );
        } else {
            var text = ez2.readAsText('fasta.xml','utf8');
            json = xml.parse(text );
        }

        fs.writeFile('./test.fasta.json', JSON.stringify(json), function(err){
            if(err){ return console.log(err);}
        });
        saveFasta(json);
    }

    if(file_names.indexOf('param.xml') > -1){
        var json = undefined;

        if(file_names.indexOf('param.json') > -1){
            var text = ez2.readAsText('param.json','utf8');
            json = JSON.parse(text);
        } else {
            var text = ez2.readAsText('param.xml','utf8');
            json = xml.parse(text);
        }


        fs.writeFile('./test.params.xml', JSON.stringify(json), function(err){
            if(err){return console.log(err);}
        });
        tools.setTools(json);
        saveParams(json);
    }
}

function saveFile(file){
    var archive = archiver('zip');
    var gui = window.require('nw.gui');
    var win;

    var outpipe = fs.createWriteStream(file);

    archive.on('error', function(err){
        throw err;
    });
    
    outpipe.on('open', function(){
        win = gui.Window.open('file_saving.html', {position:'center', focus: true, height: 100, width: 600, toolbar: false})
    });
    outpipe.on('close', function(){
        win.close(true);
        gui.Window.open('file_saved.html', {position:'center', focus: true, height: 100, width: 600, toolbar: false} );
    });
    archive.pipe(outpipe);

    ez2.getEntries().forEach(function(entry){
        if(['protein_summary.json'].indexOf(entry.entryName) > -1){ true; }
        else {
            archive.append(new Buffer(ez2.readAsText(entry.entryName,'utf8')), {name: entry.entryName});
        }
    });
    archive.append(new Buffer(JSON.stringify(protein_js)), {name: 'protein_summary.json'}).
        append(new Buffer(JSON.stringify(scan_js)), {name: 'scans.json'}).
        append(new Buffer(JSON.stringify(fasta_js)), {name: 'fasta.json'}).
        append(new Buffer(JSON.stringify(params_js)), {name: 'params.json'}).
        finalize();
}

function calculateCoverage(protein){
    var seq_map = [];
    var seq_count = 0;
    //return empty if no sequence
    if(typeof fasta_js[protein].sequence === 'undefined'){ return {"coverage": 0, "observed": 0, "total": 0  };}
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

function calculateGravy(protein){
    //return 0 if there is no sequence
    if(typeof fasta_js[protein].sequence === 'undefined'){ return NaN;}
    tools.setSequence(fasta_js[protein].sequence);
    return tools.calculateGravy();
}

function calculateMonoWeight(protein){
    //return 0 if there is no sequence
    if(typeof fasta_js[protein].sequence === 'undefined'){ return NaN;}
    tools.setSequence(fasta_js[protein].sequence);
    return tools.calculateMonoWeight();
}

function calculatePH(protein){
    //return 0 if there is no sequence
    if(typeof fasta_js[protein].sequence === 'undefined'){ return NaN;}
    tools.setSequence(fasta_js[protein].sequence);
    return tools.calculatePI();
}

function collectPeptides(protein){
    var hash = {};
    //console.log("collect " + protein);
    window.$.each(getProteinDetails(protein).pep2scan, function(i, v){
        hash[i] = v.length;
    });
    return hash;
}

function peptideMatchScore(protein1, protein2){
    var p1 = collectPeptides(protein1);
    var p2 = collectPeptides(protein2);
    var m1 = 0;
    var m2 = 0;
    var h = 0;
    window.$.each(p1, function(peptide, count){
        if(peptide in p2){
            h++;
        } else {
            m1++;
        }
    });
    window.$.each(p2, function(peptide, count){
       if(!(peptide in p1)){
           m2++;
       }
    });
    var test;
    if(h === 0){
        test = 0;
    } else if(m1 + m2 === 0){
        test = 1;
    } else if(m1 === 0){
        test = 2;
    } else if(m2 === 0){
        test = 3;
    } else {
        test = 4;
    }
    return test;
}

function getRedundantProteins(){
    var proteins = Object.keys(getProteins()).sort();
    var group = {};
    var redundant = {};
    var superset = {};
    var subset = {};
    var overlap = {};
    console.log("size: " + proteins.length);
    for(var i = 0;i < proteins.length - 1; i++){
        for(var j = i + 1; j < proteins.length; j++){
            //console.log("proteins " + proteins[i] + " " + proteins[j]);
            var score = peptideMatchScore(proteins[i], proteins[j]);
            //console.log(score);
            if(score === 0){ continue; }
            group[proteins[i]] = 1;
            group[proteins[j]] = 1;
            if(score === 1){
                if(proteins[i] in redundant && proteins[j] in redundant[proteins[i]]) {
                    redundant[proteins[i]][proteins[j]]++;
                    redundant[proteins[j]][proteins[i]]++;
                }
                else{
                    if(!(proteins[i] in redundant)) { redundant[proteins[i]] = {};}
                    if(!(proteins[j] in redundant)) { redundant[proteins[j]] = {};}
                    //console.log(JSON.stringify(redundant));
                    redundant[proteins[i]][proteins[j]] = 1;
                    redundant[proteins[j]][proteins[i]] = 1;
                }
            } else if(score === 2){
                if(proteins[i] in superset && proteins[j] in superset[proteins[i]]) {
                    superset[proteins[i]][proteins[j]]++;
                    subset[proteins[j]][proteins[i]]++;
                }
                else{
                    if(!(proteins[i] in superset)) { superset[proteins[i]] = {};}
                    if(!(proteins[j] in subset)) { subset[proteins[j]] = {};}
                    superset[proteins[i]][proteins[j]] = 1;
                    subset[proteins[j]][proteins[i]] = 1;
                }
            } else if(score === 3){
                if(proteins[i] in subset && proteins[j] in subset[proteins[i]]) {
                    subset[proteins[i]][proteins[j]]++;
                    superset[proteins[j]][proteins[i]]++;
                }
                else{
                    if(!(proteins[i] in subset)) { subset[proteins[i]] = {};}
                    if(!(proteins[j] in superset)) { superset[proteins[j]] = {};}
                    subset[proteins[i]][proteins[j]] = 1;
                    superset[proteins[j]][proteins[i]] = 1;
                }
            } else if(score === 4){
                if(proteins[i] in overlap && proteins[j] in overlap[proteins[i]]) {
                    overlap[proteins[i]][proteins[j]]++;
                    overlap[proteins[j]][proteins[i]]++;
                }
                else{
                    if(!(proteins[i] in overlap)) { overlap[proteins[i]] = {};}
                    if(!(proteins[j] in overlap)) { overlap[proteins[j]] = {};}
                    overlap[proteins[i]][proteins[j]] = 1;
                    overlap[proteins[j]][proteins[i]] = 1;
                }
            }
        }
    }
    //return {redundant: redundant, superset: superset, subset: subset, overlap: overlap};
    // get list of unique proteins
    window.$.each(group, function(protein, v){
       group[protein] = { redundant: redundant[protein],
                        subset: subset[protein],
                        superset: superset[protein],
                        overlap: overlap[protein]
       }
    });

    //create peptide list
    window.$.each(group, function(protein, results){
        var peptides = collectPeptides(protein);
        //console.log(protein);
        //console.log("1: " + JSON.stringify(group));
        window.$.each(results, function(gr,matches){
            //console.log(gr);
            //console.log("2: " + JSON.stringify(group));
            if(!(typeof matches === 'undefined')) {
                window.$.each(matches, function (match_prot, v) {
                    //console.log(JSON.stringify(match_prot));
                    //group[protein][gr][match_prot] = collectPeptides(match_prot);
                    var match_peptides = {};
                    window.$.each(collectPeptides(match_prot), function(pep, count){
                        match_peptides[pep] = {
                            count: count,
                            match: pep in peptides
                        }
                    });
                    group[protein][gr][match_prot] = match_peptides;
                    //console.log("3: " + JSON.stringify(group));
                });
            }
        });
        group[protein].peptides = peptides;
    });
    return group;
}

function getIonCore(scan){
    tools.setSequence(getScanDetails(scan).match_peptide);
    return tools.ionCore();
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

function getProteinDetails(protein){
    return protein_js[protein];
}

function getScanDetails(scan){
    //added for backwards compatability
    if(isNaN(scan_js[scan].peptide_prob)){ scan_js[scan].peptide_prob = scan_js[scan].peptide_prophet}
    return scan_js[scan];
}

function getParamDetails(){
    return params_js;
}

function listAllPeptides(protein){
    var json = getProteins();
    var peptides = json[protein].peptides;
    if( typeof peptides === 'string'){
        peptides = [peptides];
    }
    return peptides.sort();
}

function removeProteins(proteins){
    for(var i=0; i < proteins.length; i++){
       console.log( proteins[i] + " deleted: " +
           delete protein_js[proteins[i]]);
    }
}

function saveProteins(json){
    window.localStorage.clear();
    var new_js = {};
    window.$.each(json, function(){
        new_js[this.accession] = updatePep2Scan(this);
        new_js[this.accession] = updateModifications(this);
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

function saveParams(json){
    var new_js = {};
    window.$.each(json, function(){
        new_js[this.accession] = this;
    });
    params_js = new_js;
}

function totalScans(){
    return Object.keys(scan_js).length;
}

function updateModifications(json){
    var peptides = json.peptides;
    if(typeof peptides === 'string'){
        peptides = [peptides];
    }
    var mods_json = {"*": 0, "#": 0, "@": 0, "^": 0, "~": 0, "$": 0, "]": 0, "[": 0};
    window.$.each(peptides, function(i, pep){
        window.$.each(mods_json, function(mod, v){
            var pat = RegExp('\\' + mod);
            if(pat.test(pep)){ mods_json[mod] += 1; }
        });
    });
    json.modifications = mods_json;
    return json;
}

function updatePep2Scan(json){
    var new_pep2scan = {};
    window.$.each(json.pep2scan, function(index, val){
        var scans = [];
        window.$.each(val, function(i, v){
            if(i != 'sequence'){ scans.push(v)}
        });

        if('sequence' in json.pep2scan){
            new_pep2scan[val.sequence] = scans;
        } else {
            new_pep2scan[index] = scans;
        }
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
    getParamDetails: getParamDetails,
    listAllPeptides: listAllPeptides,
    getFasta: getFasta,
    getIonCore: getIonCore,
    calculateCoverage: calculateCoverage,
    calculateGravy: calculateGravy,
    calculateMonoWeight: calculateMonoWeight,
    calculatePH: calculatePH,
    totalScans: totalScans,
    getRedundantProteins: getRedundantProteins,
    removeProteins: removeProteins,
    saveFile: saveFile
};