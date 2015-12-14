var protein_prob_filter = 0;
var scan_count_filter = 0;
var peptide_count_filter = 0;

function setProteinProbFilter(val){
    protein_prob_filter = val;
}

function setScanCountFilter(val){
    scan_count_filter = val;
}

function setPeptideCountFilter(val){
    peptide_count_filter = val;
}

function getProteinProbFilter(){
    return protein_prob_filter;
}

function getScanCountFiler(){
    return scan_count_filter;
}

function getPeptideCountFilter(){
    return peptide_count_filter;
}

module.exports = {
    setProteinProbFilter: setProteinProbFilter,
    setScanCountFilter: setScanCountFilter,
    setPeptideCountFilter: setPeptideCountFilter,
    getProteinProbFilter: getProteinProbFilter,
    getScanCountFiler: getScanCountFiler,
    getPeptideCountFilter: getPeptideCountFilter
}