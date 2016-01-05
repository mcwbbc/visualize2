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
}

function calculateGravy(sequence){
    if(typeof sequence === 'string'){
        var total_gravy = 0;
        window.$.each(sequence.split(''), function(i, aa){
            total_gravy += gravy[aa];
        });
        return total_gravy / sequence.length;
    }
    return null;
}

module.exports = {
    calculateGravy: calculateGravy
}