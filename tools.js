'use strict';

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

function calculateGravy(sequence){
    if(typeof sequence === 'string'){
        var total_gravy = 0;
        window.$.each(composition(sequence), function(aa, count){
            total_gravy += gravy[aa] * count;
        });
        return total_gravy / sequence.length;
    }
    return null;
}

function calculatePI(sequence){
    if(typeof sequence === 'string'){
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
            window.$.each(["K", "R", "H"], function(i, basic){
                cr = Math.pow(10, pka[basic] - pH);
                pc = (typeof comp[basic] === "undefined" ? 0 : comp[basic] * (cr/(cr+1)));
                charge += pc;
            });

            window.$.each(["D", "E", "C", "Y"], function(i, acid){
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
    return null;
}

function composition(sequence){
    var comp = {};
    window.$.each(sequence.split(''),function(i, aa){
        comp[aa] = (typeof comp[aa] === "undefined" ? 1 : comp[aa] + 1);
    });
    return comp;
}

module.exports = {
    calculateGravy: calculateGravy,
    calculatePI: calculatePI
}