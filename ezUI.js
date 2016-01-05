'use strict';

var gui = window.require('nw.gui');
var ezf = require('./ezf');
var filter = require('./filters');
var peptide_table;
var cntx;
var protein_menu = new gui.Menu();
var protein_data_table;

function openEzView(file){
    cntx = gui.Window.open('./ez_view.html', {
        position: 'center',
        title: 'Visualize',
        width: 1300,
        height: 700,
        toolbar: false,
        focus: true,
        fullscreen: false
    });

    ezf.readEz2(file);
    cntx.on('loaded', function(){
        listProteins();
        addProteinClick();
        addProteinMenu();
        addShortCuts();
        addFilterClick();
    });

    cntx.on('resize', function(){
        cntx.window.$('#column-1').removeAttr('style');
        cntx.window.$('#column-2').removeAttr('style');
    });
}

function addFilterClick(){
    cntx.window.$('#filter').click(function(){
        window.$.get('./filters.html', function(html){
            cntx.window.$('.panel-body', '#details').html(html);
            setFilterValues(filter.getProteinProbFilter(),
                filter.getPeptideCountFilter(),
                filter.getScanCountFiler(),
                filter.getModificationFilter(),
                filter.getDecoyFilter());
            enableModificationFilter();
            cntx.window.$('#filter-on').click(function(){
                var protein_val = cntx.window.$('#protein-prob-filter').val();
                var pep_val = cntx.window.$('#pep-count-filter').val();
                var scan_val = cntx.window.$('#scan-count-filter').val();
                var mod_val = cntx.window.$('#modification-filter').val();
                var decoy_prop = cntx.window.$('[name=decoy-cont-filter]').prop('checked');
                filter.setProteinProbFilter(protein_val);
                filter.setPeptideCountFilter(pep_val);
                filter.setScanCountFilter(scan_val);
                filter.setModificationFilter(mod_val);
                filter.setDecoyFilter(decoy_prop);
                protein_data_table.draw();
                var btn = cntx.window.$('#filter');
                btn.removeClass('btn-primary');
                btn.addClass('btn-warning');
                setScanTotal();
            });
            cntx.window.$('#filter-off').click(function(){
                setFilterValues(0,0,0,'', false);
                filter.setPeptideCountFilter(0);
                filter.setProteinProbFilter(0);
                filter.setScanCountFilter(0);
                filter.setDecoyFilter(false);
                protein_data_table.draw();
                var btn = cntx.window.$('#filter');
                btn.addClass('btn-primary');
                btn.removeClass('btn-warning');
                cntx.window.$('button', '#filter-mod-sym').prop('disabled', false);
                cntx.window.$('button', '#filter-mod-logic').prop('disabled', true);
                cntx.window.$('#total_scans_shown').text(100);
            });
        });
    });
}

function enableModificationFilter(){
    var mod_filter = cntx.window.$('#modification-filter');
    cntx.window.$('button', '.mod-filter-group').click(function(){
        var text = mod_filter.val();
        console.log(text);
        text += window.$(this).text();
        console.log(text);
        mod_filter.val(text);
        cntx.window.$('button', '.mod-filter-group').prop('disabled', function(i, v){ return !v; });
    });
    cntx.window.$('#mod-reset').click(function(){
        mod_filter.val('');
        cntx.window.$('button', '#filter-mod-sym').prop('disabled', false);
        cntx.window.$('button', '#filter-mod-logic').prop('disabled', true);
    });
    return;
}

function setScanTotal(){
    var scans_left = 0;
    cntx.window.$('.scan_count', '.protein').each(function(){
        scans_left += Number(window.$(this).text());
    });
    cntx.window.$('#total_scans_shown').text(Number(100 * scans_left / ezf.totalScans()).toPrecision(2));
    //cntx.window.$('#total_scans_shown').text(Number(scans_left));
}

function setFilterValues(prot, pep, scan, mod, decoy){
    cntx.window.$('#protein-prob-filter').val(prot);
    cntx.window.$('#pep-count-filter').val(pep);
    cntx.window.$('#scan-count-filter').val(scan);
    cntx.window.$('#modification-filter').val(mod)
    cntx.window.$('[name=decoy-cont-filter]').prop('checked', decoy)
}

function addShortCuts(){
    cntx.window.$(cntx.window.document).keydown(function(e){
        if(e.which === 38){ //arrow up
            e.preventDefault();
            var i = getActiveTR();
            if(i > -1) {
                setActiveTR(i - 1);
                updateProteinInfo(cntx.window.$('.success', '#protein-table').attr('accession-data'));
            }
        } else if(e.which === 40){ //arrow down
            e.preventDefault();
            var i = getActiveTR();
            if(i > -1) {
                setActiveTR(i + 1);
                updateProteinInfo(cntx.window.$('.success', '#protein-table').attr('accession-data'));
            }
        }
    })
}
/*
function addGlobalShortCuts(){
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
*/
function getActiveTR(){
    var tr = cntx.window.$('.success', '#protein-table');
    return tr.index();
}

function setActiveTR(index){
    cntx.window.$('.success').removeClass('success');
    if(index >= cntx.window.$('tr', '#protein-table tbody').length){ index = 0;}
    var htmlTR = cntx.window.$('tr', '#protein-table tbody').get(Number(index));
    cntx.window.$(htmlTR).addClass('success');
    htmlTR.scrollIntoView({behavior: "smooth"});
}

function listProteins(){
    window.$.each(ezf.getProteins(), function () {
        var template = cntx.window.document.querySelector('#protein-tr-template');
        template.content.querySelector('.protein').setAttribute('accession-data', this.accession);
        template.content.querySelector('.pp').innerText = Number(this.protein_prob).toPrecision(4);
        template.content.querySelector('.name').innerText = this.name;
        template.content.querySelector('.accession').innerText = this.accession;
        template.content.querySelector('.pep_count').innerText = this.peptide_count;
        template.content.querySelector('.scan_count').innerText = this.scan_count;
        template.content.querySelector('.mod-0').innerText = this.modifications['*'];
        template.content.querySelector('.mod-1').innerText = this.modifications['#'];
        template.content.querySelector('.mod-2').innerText = this.modifications['@'];
        template.content.querySelector('.mod-3').innerText = this.modifications['^'];
        template.content.querySelector('.mod-4').innerText = this.modifications['~'];
        template.content.querySelector('.mod-5').innerText = this.modifications['$'];
        template.content.querySelector('.mod-6').innerText = this.modifications[']'];
        template.content.querySelector('.mod-7').innerText = this.modifications['['];
        var clone = cntx.window.document.importNode(template.content, true);
        cntx.window.$('tbody', '#protein-table').append(clone);

    });
    protein_data_table = cntx.window.$('#protein-table').DataTable({
        "paging": false,
        "info": false,
        "order": [[0, "desc"],[4,"desc"],[3,"desc"]],
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
        var template = cntx.window.document.querySelector('#peptide-tr-template');
        template.content.querySelector('.peptide').setAttribute('peptide-data', this);
        template.content.querySelector('.scan_count').innerText = ezf.getScans(accession, this).length;
        template.content.querySelector('.sequence').innerText = this;
        var clone = cntx.window.document.importNode(template.content, true);
        cntx.window.$('tbody', '#peptide-table').append(clone);
    })
    addPeptideClick(accession);
    /*peptide_table = cntx.window.$('#peptide-table').DataTable({
        "paging": false,
        "info": false,
        "order": [[0, "desc"]],
        "dom": ''
    });*/
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
        var template = cntx.window.document.querySelector('#scan-tr-template');
        template.content.querySelector('.scan').setAttribute('scan-data', this);
        template.content.querySelector('.name').innerText = this;
        var clone = cntx.window.document.importNode(template.content, true);
        cntx.window.$('tbody', '#scan-table').append(clone);
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
    /*var html = "<h3>Details</h3>";
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
        Number(ezf.getScanDetails(scan).tic).toPrecision(5) + "</div></div>";*/
    var template = cntx.window.document.querySelector('#scan-details-template');
    template.content.querySelector('#detail-name').innerText = ezf.getScanDetails(scan).name;
    template.content.querySelector('#detail-accession').innerText = ezf.getScanDetails(scan).reference;
    template.content.querySelector('#detail-sequence').innerText = ezf.getScanDetails(scan).match_peptide;
    template.content.querySelector('#detail-pep_prob').innerText = Number(ezf.getScanDetails(scan).peptide_prob).toPrecision(2);
    template.content.querySelector('#detail-pp_discrim').innerText = Number(ezf.getScanDetails(scan).pp_discrim).toPrecision(2);
    template.content.querySelector('#detail-charge').innerText = ezf.getScanDetails(scan).charge;
    template.content.querySelector('#detail-delta_cn').innerText = Number(ezf.getScanDetails(scan).deltaCn).toPrecision(4);
    template.content.querySelector('#detail-mass').innerText = Number(ezf.getScanDetails(scan).mass).toPrecision(9);
    template.content.querySelector('#detail-tic').innerText = Number(ezf.getScanDetails(scan).tic).toPrecision(5);
    var clone = cntx.window.document.importNode(template.content, true);
    cntx.window.$('.panel-body', '#details').html(clone);
}

function updateProteinDetails(accession){
    /*var html = "<h3>Details</h3>";

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
    html += "</table>";*/
    var coverage = ezf.calculateCoverage(accession);
    var template = cntx.window.document.querySelector('#protein-details-template');
    template.content.querySelector('#detail-description').innerText = ezf.getProteinDetails(accession).description;
    template.content.querySelector('#detail-max_xcorr').innerText = ezf.getProteinDetails(accession).max_xcorr;
    template.content.querySelector('#detail-total_xcorr').innerText = ezf.getProteinDetails(accession).total_xcorr;
    template.content.querySelector('#detail-total_tic').innerText = ezf.getProteinDetails(accession).total_tic;
    template.content.querySelector('#detail-gravy').innerText = ezf.calculateGravy(accession).toPrecision(5);
    template.content.querySelector('#detail-coverage').innerText =
    coverage.observed + " of " +
    coverage.total + " aa. " +
    (coverage.coverage * 100).toPrecision(5) + "%";

    var clone = cntx.window.document.importNode(template.content, true);
    cntx.window.$('.panel-body','#details').html(clone);

    window.$.each(ezf.listAllPeptides(accession), function(){
        var trTemp = cntx.window.document.querySelector('#protein-details-peptides-tr');
        trTemp.content.querySelector('td').innerText = this;
        var trClone = cntx.window.document.importNode(trTemp.content, true);
        cntx.window.$('tbody', '#detail-peptides-table').append(trClone);
    });
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
