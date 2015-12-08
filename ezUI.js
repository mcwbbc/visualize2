'use strict';

var gui = window.require('nw.gui');
var ezf = require('./ezf');
var peptide_table;
var cntx;
var protein_menu = new gui.Menu();

function openEzView(file){
    cntx = gui.Window.open('./ez_view.html', {
        position: 'center',
        title: 'Visualize',
        width: 800,
        height: 600,
        toolbar: true,
        focus: true,
        fullscreen: true
    });

    ezf.readEz2(file);
    cntx.on('loaded', function(){
        listProteins();
        addProteinClick();
        addProteinMenu();
    });

    cntx.on('resize', function(){
        cntx.window.$('#column-1').removeAttr('style');
        cntx.window.$('#column-2').removeAttr('style');
    });


    addShortCuts();

}

function addShortCuts(){
    var upKey = {
        key: "Up",
        active: function(){
            var i = getActiveTR();
            if(i > -1) {
                console.log('change row');
                setActiveTR(i - 1);
                updateProteinInfo(cntx.window.$('.success', '#protein-table').attr('accession-data'));
            }
        },
        failed: function(msg){
            console.log(msg);
        }
    };

    var keyDown = {
        key: "Down",
        active: function(){
            var i = getActiveTR();
            console.log('i: ' + i);
            if(i > -1) {
                console.log('change row');
                setActiveTR(i + 1);
                updateProteinInfo(cntx.window.$('.success', '#protein-table').attr('accession-data'));
            }
        },
        failed: function(msg){
            console.log(msg);
        }
    };

    var upEvent = new gui.Shortcut(upKey);
    gui.App.registerGlobalHotKey(upEvent);
    var downEvent = new gui.Shortcut(keyDown);
    gui.App.registerGlobalHotKey(downEvent);
}

function getActiveTR(){
    var tr = cntx.window.$('.success', '#protein-table');
    //console.log('row: ' + tr.index());
   return tr.index();
}

function setActiveTR(index){
    cntx.window.$('.success').removeClass('success');
    console.log('l: ' + cntx.window.$('tr', '#protein-table tbody').length);
    if(index >= cntx.window.$('tr', '#protein-table tbody').length){ index = 0;}
    var htmlTR = cntx.window.$('tr', '#protein-table tbody').get(Number(index));
    cntx.window.$(htmlTR).addClass('success');
    htmlTR.scrollIntoView({behavior: "smooth"});
}

function listProteins(){
    window.$.each(ezf.getProteins(), function () {
        //console.log(JSON.stringify(this.name));
        cntx.window.$('tbody','#protein-table').append("<tr class=protein accession-data=" + this.accession + ">" +
                "<td>" + Number(this.protein_prob).toPrecision(4) + "</td>" +
                "<td>" + this.name + "</td>" +
                "<td>" + this.accession + "</td>" +
                "<td>" + this.peptide_count + "</td>" +
                "<td>" + this.scan_count + "</td>" +
                "</tr>");
    });
    cntx.window.$('#protein-table').DataTable({
        "paging": false,
        "info": false,
        "order": [[0, "desc"]],
        "dom": '<"top">f'

    });
}

function addProteinClick(){
    console.log("DEBUG: adding protein click events");
    cntx.window.$('.protein', '#protein-table').click(function(){
        cntx.window.$('.success').removeClass('success');
        cntx.window.$(this).addClass('success');
        updateProteinInfo(cntx.window.$(this).attr('accession-data'));
        //console.log(cntx.window.$(this).attr('accession-data'));
    });
}

function updateProteinInfo(accession){
    cntx.window.$('tbody', '#scan-table').html('');
    listPeptides(accession);
    updateProteinDetails(accession);
}

function listPeptides(accession) {
    if(cntx.window.$.fn.dataTable.isDataTable( '#peptide-table')){
        peptide_table.destroy();
    }
    cntx.window.$('tbody', '#peptide-table').html('');
    
    window.$.each(ezf.getPeptides(accession), function () {
        cntx.window.$('tbody','#peptide-table').append("<tr class=peptide peptide-data=" + this +">" +
            "<td>" + ezf.getScans(accession, this).length + "</td>" +
            "<td>" + this + "</td>" +
            "</tr>");
    })
    addPeptideClick(accession);
    peptide_table = cntx.window.$('#peptide-table').DataTable({
        "paging": false,
        "info": false,
        "order": [[0, "desc"]],
        "dom": ''
    });
}

function addPeptideClick(accession){
    //console.log("DEBUG: adding peptide click events");
    cntx.window.$('.peptide', '#peptide-table').click(function(){
        //console.log(cntx.window.$(this).attr('accession-data'));
        cntx.window.$('.success', '#peptide-table').removeClass('success');
        cntx.window.$('.success', '#scan-table').removeClass('success');
        cntx.window.$(this).addClass('success');
        cntx.window.$('tbody', '#scan-table').html('');
        listScans(accession, cntx.window.$(this).attr('peptide-data'));
    });
}

function listScans(accession, sequence){
    window.$.each(ezf.getScans(accession, sequence), function(){
        cntx.window.$('tbody', '#scan-table').append("<tr class=scan scan-data=" + this + ">" +
        "<td>" + this + "</td>" +
        "</tr>");
    });
    addScanClick();
}

function addScanClick(){
    cntx.window.$('tr', '#scan-table').click(function(){
        cntx.window.$('.success', '#scan-table').removeClass('success');
        cntx.window.$(this).addClass('success');
        updateScanDetails(cntx.window.$(this).attr('scan-data'), cntx);
    });
}

function updateScanDetails(scan){
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

function updateProteinDetails(accession){
    var html = "<h3>Details</h3>";

    var coverage = ezf.calculateCoverage(accession);
    html += "<div class=row><div class=col-xs-3>Description</div><div class=col-xs-9>" +
        ezf.getProteinDetails(accession).description + "</div></div>" +
        "<div class=row><div class=col-xs-3>Max XCorr</div><div class=col-xs-6>" +
        ezf.getProteinDetails(accession).max_xcorr + "</div></div>" +
        "<div class=row><div class=col-xs-3>Total XCorr</div><div class=col-xs-6>" +
        ezf.getProteinDetails(accession).total_xcorr + "</div></div>" +
        "<div class=row><div class=col-xs-3>Total TIC</div><div class=col-xs-6>" +
        ezf.getProteinDetails(accession).total_tic + "</div></div>" +
        "<div class=row><div class=col-xs-3>% Coverage</div><div class=col-xs-6>" +
        coverage.observed + " of " +
        coverage.total + " aa. " +
        (coverage.coverage * 100).toPrecision(5) + "%</div></div>";

    html += "<table class=table>";
    window.$.each(ezf.listAllPeptides(accession), function(){
        html += "<tr><td>" + this +"</td></tr>";
    });
    html += "</table>";
    cntx.window.$('#details').html(html);
}

function addProteinMenu(){

    cntx.window.$('.protein', '#protein-table').contextmenu(function(event) {
        event.preventDefault();
        //console.log("clicked at: " + event.pageX + "," + event.pageY);
        var window_offset_x = gui.Window.get(cntx.window).x - gui.Window.get().x;
        var window_offset_y = gui.Window.get(cntx.window).y - gui.Window.get().y;

        //empty context menu
        emptyMenu(protein_menu);


        var acc = cntx.window.$(this).attr('accession-data');
        protein_menu.append(new gui.MenuItem({
                        label: 'See in UniProt',
                        click: function(){ go2UniProt(acc); }
                    }));
        protein_menu.append(new gui.MenuItem({
                        label: 'See Sequence',
                        click: function(){ showSequence(acc); }
                    })
        );
        protein_menu.popup(event.pageX + window_offset_x, event.pageY + window_offset_y);
        return false;
    });
}

function emptyMenu(menu){
    // always remove the 0th item, since the menu automatically resizes itself after an item is removed
    window.$.each(menu.items, function(){
        menu.removeAt(0);
    });
}

function go2UniProt(accession){
    console.log('context clicked ' + accession);
    var url = 'http://www.uniprot.org/uniprot/' + accession;
    gui.Shell.openExternal(url);
}

function showSequence(accession){
    var html = "<h3>Details</h3>";
    html += "<div class=col-xs-12>" + ezf.getFasta(accession) + "</div>";
    cntx.window.$('#details').html(html);
}

module.exports = {
	openEzView: openEzView
}
