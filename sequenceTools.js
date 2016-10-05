'use strict';

var sequence;
var valid_sequence;
var diff_mods = {};

var avg_aa_mass = {
    G: 57.0519,
    A: 71.0788,
    S: 87.0782,
    P: 97.1167,
    V: 99.1326,
    T: 101.1051,
    C: 103.1388,
    I: 113.1594,
    L: 113.1594,
    N: 114.1038,
    D: 115.0886,
    Q: 128.1307,
    K: 128.1741,
    E: 129.1155,
    M: 131.1926,
    H: 137.1411,
    F: 147.1766,
    R: 156.1875,
    Y: 163.1760,
    W: 186.2132,
    U: 150.0388,
    O: 237.3018,
    H2O: 18.01524
};

var mono_aa_mass = {
    G: 57.02146,
    A: 71.03711,
    S: 87.03203,
    P: 97.05276,
    V: 99.06841,
    T: 101.04768,
    C: 103.00919,
    I: 113.08406,
    L: 113.08406,
    N: 114.04293,
    D: 115.02694,
    Q: 128.05858,
    K: 128.09497,
    E: 129.04259,
    M: 131.04049,
    H: 137.05891,
    F: 147.06841,
    R: 156.10111,
    Y: 163.06333,
    W: 186.07931,
    U: 150.953636,
    O: 237.147727,
    H2O: 18.01056
};

var gravy = {
    G: -0.4,
    A: 1.8,
    S: -0.8,
    P: -1.6,
    V: 4.2,
    T: -0.7,
    C: 2.5,
    I: 4.5,
    L: 3.8,
    N: -3.5,
    D: -3.5,
    Q: -3.5,
    K: -3.9,
    E: -3.5,
    M: 1.9,
    H: -3.2,
    F: 2.8,
    R: -4.5,
    Y: -1.3,
    W: -0.9
};

var pka = {
    K: 9.8,
    K_NT: 10,
    K_CT: 10.3,
    R: 12.5,
    R_NT: 11.5,
    R_CT: 11.5,
    H: 6.08,
    H_NT: 4.89,
    H_CT: 6.89,
    D: 4.07,
    D_NT: 3.57,
    D_CT: 4.57,
    E: 4.45,
    E_NT: 4.15,
    E_CT: 4.75,
    C: 8.28,
    C_NT: 8,
    C_CT: 9,
    Y: 9.84,
    Y_NT: 9.34,
    T_CT: 10.34,
    NT_G: 7.50,
    CT_G: 3.70,
    NT_A: 7.58,
    CT_A: 3.75,
    NT_S: 6.86,
    CT_S: 3.61,
    NT_P: 8.36,
    CT_P: 3.40,
    NT_V: 7.44,
    CT_V: 3.69,
    NT_T: 7.02,
    CT_T: 3.57,
    NT_C: 8.12,
    CT_C: 3.10,
    NT_I: 7.48,
    CT_I: 3.72,
    NT_L: 7.46,
    CT_L: 3.73,
    NT_N: 7.22,
    CT_N: 3.64,
    NT_D: 7.70,
    CT_D: 3.50,
    NT_Q: 6.73,
    CT_Q: 3.57,
    NT_K: 6.67,
    CT_K: 3.40,
    NT_E: 7.19,
    CT_E: 3.50,
    NT_M: 6.98,
    CT_M: 3.68,
    NT_H: 7.18,
    CT_H: 3.17,
    NT_F: 6.96,
    CT_F: 3.98,
    NT_R: 6.76,
    CT_R: 3.41,
    NT_Y: 6.83,
    CT_Y: 3.60,
    NT_W: 7.11,
    CT_W: 3.78
};

//Initialize
function setTools(params){
    setDiffModHash(params.analysis.Sequest.diff_search_options);
    updateMonoMasses(params.analysis.Sequest);
}

function setDiffModHash(string){
    var mod_array = string.split(" ");
    var count = 0;
    var mod_symbols = ['*','#','@','^','~','$']
    while(count < mod_array.length){
        var mass = mod_array[count];
        var aa = mod_array[count + 1];
        var cur_symbol = mod_symbols.shift();
        global.$.each(aa.split(""), function(i,v){
            diff_mods[v + cur_symbol] = Number(mass);
        });
        count += 2;
    }
    //console.log(JSON.stringify(diff_mods));
}

function updateMonoMasses(js){
    global.$.each(js, function(key, val){
        var pat = /add_(\w)_/;
        var aa = key.match(pat);
        //console.log(key);
        //console.log(aa);
        if(aa !== null && aa.length != 0){
            mono_aa_mass[aa] += val;
        }
    });
}

function setSequence(seq){
    sequence = seq;
    if(typeof sequence === 'string'){
        valid_sequence = true;
        var core = sequence.split('.');
        if(core.length > 2){
            sequence = core[1];
        }
    } else {
        valid_sequence = false;
    }
}

function calculateGravy(){
    if(valid_sequence){
        var total_gravy = 0;
        global.$.each(composition(sequence), function(aa, count){
            total_gravy += gravy[aa] * count;
        });
        return total_gravy / sequence.length;
    }
    return NaN;
}

function calculateMonoWeight(){
    if(valid_sequence){
        var mono_isotopic_weight = mono_aa_mass['H2O'];
        global.$.each(composition(sequence), function(aa, count){
            mono_isotopic_weight += mono_aa_mass[aa] * count;
        });
        return mono_isotopic_weight;
    }
    return NaN;
}

function calculatePI(){
    if(valid_sequence){
        var charge = 1000;
        var pH = 7;
        var delta_pH = 3.5;
        var min_pH = 0;
        var comp = composition(sequence);
        var n_pKa = pka["NT_" + sequence.substring(0,1)];
        var c_pKa = pka["CT_" + sequence.substring(sequence.length - 1, sequence.length)];
        while(Math.abs(charge) > 0.002){
            charge = 0;
            var cr = Math.pow(10, n_pKa - pH);
            var pc = cr/(cr+1);
            charge += pc;
            cr = Math.pow(10, pH - c_pKa);
            pc = cr/(cr+1);
            charge -= pc;
            global.$.each(["K", "R", "H"], function(i, basic){
                cr = Math.pow(10, pka[basic] - pH);
                pc = (typeof comp[basic] === "undefined" ? 0 : comp[basic] * (cr/(cr+1)));
                charge += pc;
            });

            global.$.each(["D", "E", "C", "Y"], function(i, acid){
                cr = Math.pow(10, pH - pka[acid]);
                pc = (typeof comp[acid] === "undefined" ? 0 : comp[acid] * (cr/(cr+1)));
                charge -= pc;
            });

            if(charge > 0){
                pH += delta_pH;
            } else {
                pH -= delta_pH;
            }
            delta_pH = delta_pH / 2;
        }//while
        return pH;
    }
    return NaN;
}

function composition(){
    var comp = {};
    global.$.each(sequence.split(''),function(i, aa){
        comp[aa] = (typeof comp[aa] === "undefined" ? 1 : comp[aa] + 1);
    });
    //console.log(JSON.stringify(comp));
    return comp;
}

function ionCore(){
    var ion_core = [];
    if(valid_sequence){
        var b_ions = bIons();
        var y_ions = yIons();
        global.$.each(makeSeqPairs(), function(i, aa){
            ion_core[i] = {"aa": aa, "b_ion": b_ions.shift(), "y_ion": y_ions.pop()};
        });
    }
    console.log(JSON.stringify(ion_core));
    return ion_core;
}

function makeSeqPairs(){
    var output = [];
    var pattern = /[\*\#\@\^\~\$]/;
    var offset = 0;
    global.$.each(sequence.split(""), function(i, aa){
        if(pattern.test(aa)){
            offset += 1;
            output[i-offset] += aa;
        } else {
            output[i-offset] = aa;
        }
    });
    //console.log(JSON.stringify(output));
    return output;
}

function bIons(){
    var H = 1.00782;
    var mass = 0;
    var b_ions = [];
    global.$.each(makeSeqPairs(), function(i, aa){
        if(aa.length == 2){
            var parts = aa.split('');
            mass += mono_aa_mass[parts[0]];
            mass += diff_mods[aa];
            b_ions[i] = mass + H;
        } else {
            mass += mono_aa_mass[aa];
            b_ions[i] = mass + H;
        }
    });
    //console.log('bions: ' + JSON.stringify(b_ions));
    return b_ions;
}


function yIons(){
    var H = 1.00782;
    var mass = H + 17.00274;
    var y_ions = [];
    global.$.each(makeSeqPairs().reverse(), function(i, aa){
        if(aa.length == 2){
            var parts = aa.split('');
            mass += mono_aa_mass[parts[0]];
            mass += diff_mods[aa];
            y_ions[i] = mass + H;
        } else {
            mass += mono_aa_mass[aa];
            y_ions[i] = mass + H;
        }
    });
    //console.log('yions: ' + JSON.stringify(y_ions));
    return y_ions;
}

module.exports = {
    setSequence: setSequence,
    setTools: setTools,
    calculateGravy: calculateGravy,
    calculateMonoWeight: calculateMonoWeight,
    calculatePI: calculatePI,
    ionCore: ionCore
}