'use strict';

var gui = window.require('nw.gui');
var ezf = require('./ezf');

function openEzView(file){
    var ez_view = gui.Window.open('./ez_view.html', {
        position: 'center',
        width: 800,
        height: 600,
        toolbar: true,
        focus: true
    });

    ezf.readEz2(file);
    ez_view.on('loaded', function(){
        listProteins(ez_view);
        addProteinClick(ez_view);
    });

}

function listProteins(cntx){
    window.$.each(ezf.getProteins(), function () {
        //console.log(JSON.stringify(this.name));
        cntx.window.$('tbody','#protein-table').append("<tr class=protein accession-data=" + this.accession + ">" +
                "<td>" + Number(this.protein_prob).toPrecision(4) + "</td>" +
                "<td>" + this.name + "</td>" +
                "<td>" + this.accession + "</td>" +
                "<td>" + this.description + "</td>" +
                "</tr>");
    });
    cntx.window.$('#protein-table').DataTable({
        "paging": false,
        "info": false,
        "order": [[0, "desc"]],
        "dom": '<"top">f'

    });
}

function addProteinClick(cntx){
    console.log("DEBUG: adding protein click events");
    cntx.window.$('tr', '#protein-table').click(function(){
        //console.log(cntx.window.$(this).attr('accession-data'));
        cntx.window.$('.success').removeClass('success');
        cntx.window.$(this).addClass('success');
        cntx.window.$('tbody', '#peptide-table').html('');
        listPeptides(cntx.window.$(this).attr('accession-data'), cntx);
        updateProteinDetails(cntx.window.$(this).attr('accession-data'), cntx);
    });
}

function listPeptides(accession, cntx) {
    window.$.each(ezf.getPeptides(accession), function () {
        cntx.window.$('tbody','#peptide-table').append("<tr class=peptide peptide-data=" + this +">" +
            "<td>" + this + "</td>" +
            "</tr>");
    })
    addPeptideClick(accession, cntx);
}

function addPeptideClick(accession, cntx){
    //console.log("DEBUG: adding peptide click events");
    cntx.window.$('tr', '#peptide-table').click(function(){
        //console.log(cntx.window.$(this).attr('accession-data'));
        cntx.window.$('.success', '#peptide-table').removeClass('success');
        cntx.window.$('.success', '#scan-table').removeClass('success');
        cntx.window.$(this).addClass('success');
        cntx.window.$('tbody', '#scan-table').html('');
        listScans(accession, cntx.window.$(this).attr('peptide-data'), cntx);
    });
}

function listScans(accession, sequence, cntx){
    window.$.each(ezf.getScans(accession, sequence), function(){
        cntx.window.$('tbody', '#scan-table').append("<tr class=scan scan-data=" + this + ">" +
        "<td>" + this + "</td>" +
        "</tr>");
    });
    addScanClick(cntx);
}

function addScanClick(cntx){
    cntx.window.$('tr', '#scan-table').click(function(){
        cntx.window.$('.success', '#scan-table').removeClass('success');
        cntx.window.$(this).addClass('success');
        updateScanDetails(cntx.window.$(this).attr('scan-data'), cntx);
    });
}

function updateScanDetails(scan, cntx){
    var html = "<h3>Details</h3>";
    html += "<div class=row><div class=col-xs-3>Scan</div><div class=col-xs-6>" +
        ezf.getScanDetails(scan).name + "</div></div>" +
        "<div class=row><div class=col-xs-3>Protein</div><div class=col-xs-6>" +
        ezf.getScanDetails(scan).reference + "</div></div>" +
        "<div class=row><div class=col-xs-3>Sequence</div><div class=col-xs-6>" +
        ezf.getScanDetails(scan).match_peptide + "</div></div>" +
        "<div class=row><div class=col-xs-3>Peptide Prob</div><div class=col-xs-6>" +
        Number(ezf.getScanDetails(scan).peptide_prob).toPrecision(2) + "</div></div>" +
        "<div class=row><div class=col-xs-3>PP Discriminant Score</div><div class=col-xs-6>" +
        Number(ezf.getScanDetails(scan).pp_discrim).toPrecision(2) + "</div></div>" +
        "<div class=row><div class=col-xs-3>Charge</div><div class=col-xs-6>" +
        (ezf.getScanDetails(scan).charge) + "</div></div>" +
        "<div class=row><div class=col-xs-3>Delta Cn</div><div class=col-xs-6>" +
        Number(ezf.getScanDetails(scan).deltaCn).toPrecision(4) + "</div></div>" +
        "<div class=row><div class=col-xs-3>Mass</div><div class=col-xs-6>" +
        Number(ezf.getScanDetails(scan).mass).toPrecision(9) + "</div></div>" +
        "<div class=row><div class=col-xs-3>TIC</div><div class=col-xs-6>" +
        Number(ezf.getScanDetails(scan).tic).toPrecision(5) + "</div></div>";
    cntx.window.$('#details').html(html);
}

function updateProteinDetails(accession, cntx){
    var html = "<h3>Details</h3><table class=table>";
    window.$.each(ezf.listAllPeptides(accession), function(){
        html += "<tr><td>" + this +"</td></tr>";
    });
    html += "</table>" +
        "<div class=row><div class=col-xs-3>Max XCorr</div><div class=col-xs-6>" +
        ezf.getProteinDetails(accession).max_xcorr + "</div></div>" +
        "<div class=row><div class=col-xs-3>Total XCorr</div><div class=col-xs-6>" +
        ezf.getProteinDetails(accession).total_xcorr + "</div></div>" +
        "<div class=row><div class=col-xs-3>Total TIC</div><div class=col-xs-6>" +
        ezf.getProteinDetails(accession).total_tic + "</div></div>";
    cntx.window.$('#details').html(html);
}

module.exports = {
    openEzView: openEzView,
    listProteins: listProteins
}