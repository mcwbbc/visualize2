'use strict';

//var gui = window.require('nw.gui');
var gui = window.require('nw.gui');
var ezf = require('./ezf');
var filter = require('./filters');
var peptide_table;
var cntx;
var protein_menu = new gui.Menu();
var protein_data_table;

function openEzView(file){
    ezf.readEz2(file);
    window.$('#main').toggle();
    window.$('#report').toggle(function(){
        gui.Window.get().title = "Visualize 2.0: " + file;
        listProteins();
        addProteinClick();
        addProteinMenu();
        addShortCuts();
        addFilterClick();
        window.$('#column-1').resizable({ alsoResizeReverse: "#column-2"});
    });
}

function addFilterClick(){
    window.$('#filter').click(function(){
        window.$.get('./filters.html', function(html){
            window.$('.panel-body', '#details').html(html);
            setFilterValues(filter.getProteinProbFilter(),
                filter.getPeptideCountFilter(),
                filter.getScanCountFiler(),
                filter.getModificationFilter(),
                filter.getDecoyFilter());
            enableModificationFilter();
            window.$('#filter-on').click(function(){
                var protein_val = window.$('#protein-prob-filter').val();
                var pep_val = window.$('#pep-count-filter').val();
                var scan_val = window.$('#scan-count-filter').val();
                var mod_val = window.$('#modification-filter').val();
                var decoy_prop = window.$('[name=decoy-cont-filter]').prop('checked');
                filter.setProteinProbFilter(protein_val);
                filter.setPeptideCountFilter(pep_val);
                filter.setScanCountFilter(scan_val);
                filter.setModificationFilter(mod_val);
                filter.setDecoyFilter(decoy_prop);
                protein_data_table.draw();
                var btn = window.$('#filter');
                btn.removeClass('btn-primary');
                btn.addClass('btn-warning');
                setScanTotal();
            });
            window.$('#filter-off').click(function(){
                setFilterValues(0,0,0,'', false);
                filter.setPeptideCountFilter(0);
                filter.setProteinProbFilter(0);
                filter.setScanCountFilter(0);
                filter.setDecoyFilter(false);
                protein_data_table.draw();
                var btn = window.$('#filter');
                btn.addClass('btn-primary');
                btn.removeClass('btn-warning');
                window.$('button', '#filter-mod-sym').prop('disabled', false);
                window.$('button', '#filter-mod-logic').prop('disabled', true);
                window.$('#total_scans_shown').text(100);
            });
        });
    });
}

function enableModificationFilter(){
    var mod_filter = window.$('#modification-filter');
    window.$('button', '.mod-filter-group').click(function(){
        var text = mod_filter.val();
        console.log(text);
        text += window.$(this).text();
        console.log(text);
        mod_filter.val(text);
        window.$('button', '.mod-filter-group').prop('disabled', function(i, v){ return !v; });
    });
    window.$('#mod-reset').click(function(){
        mod_filter.val('');
        window.$('button', '#filter-mod-sym').prop('disabled', false);
        window.$('button', '#filter-mod-logic').prop('disabled', true);
    });
    return;
}

function setScanTotal(){
    var scans_left = 0;
    window.$('.scan_count', '.protein').each(function(){
        scans_left += Number(window.$(this).text());
    });
    window.$('#total_scans_shown').text(Number(100 * scans_left / ezf.totalScans()).toPrecision(2));
    //window.$('#total_scans_shown').text(Number(scans_left));
}

function setFilterValues(prot, pep, scan, mod, decoy){
    window.$('#protein-prob-filter').val(prot);
    window.$('#pep-count-filter').val(pep);
    window.$('#scan-count-filter').val(scan);
    window.$('#modification-filter').val(mod)
    window.$('[name=decoy-cont-filter]').prop('checked', decoy)
}

function addShortCuts(){
    window.$(window.document).keydown(function(e){
        if(e.which === 38){ //arrow up
            e.preventDefault();
            var i = getActiveTR();
            if(i > -1) {
                setActiveTR(i - 1);
                updateProteinInfo(window.$('.success', '#protein-table').attr('accession-data'));
            }
        } else if(e.which === 40){ //arrow down
            e.preventDefault();
            var i = getActiveTR();
            if(i > -1) {
                setActiveTR(i + 1);
                updateProteinInfo(window.$('.success', '#protein-table').attr('accession-data'));
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
                updateProteinInfo(window.$('.success', '#protein-table').attr('accession-data'));
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
                updateProteinInfo(window.$('.success', '#protein-table').attr('accession-data'));
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
    var tr = window.$('.success', '#protein-table');
    return tr.index();
}

function setActiveTR(index){
    window.$('.success').removeClass('success');
    if(index >= window.$('tr', '#protein-table tbody').length){ index = 0;}
    var htmlTR = window.$('tr', '#protein-table tbody').get(Number(index));
    window.$(htmlTR).addClass('success');
    htmlTR.scrollIntoView({behavior: "smooth"});
}

function listProteins(){
    window.$.each(ezf.getProteins(), function () {
        var template = window.document.querySelector('#protein-tr-template');
        template.content.querySelector('.protein').setAttribute('accession-data', this.accession);
        template.content.querySelector('.pp').innerText = Number(this.protein_prob).toPrecision(4);
        template.content.querySelector('.name').innerText = this.name;
        template.content.querySelector('.accession').innerText = this.accession;
        template.content.querySelector('.pep_count').innerText = this.peptide_count;
        template.content.querySelector('.scan_count').innerText = this.scan_count;
        template.content.querySelector('.mwt').innerText = ezf.calculateMonoWeight(this.accession).toPrecision(4);
        template.content.querySelector('.pi').innerText = ezf.calculatePH(this.accession).toPrecision(5);
        template.content.querySelector('.gravy').innerText = ezf.calculateGravy(this.accession).toPrecision(5);
        template.content.querySelector('.mod-0').innerText = this.modifications['*'];
        template.content.querySelector('.mod-1').innerText = this.modifications['#'];
        template.content.querySelector('.mod-2').innerText = this.modifications['@'];
        template.content.querySelector('.mod-3').innerText = this.modifications['^'];
        template.content.querySelector('.mod-4').innerText = this.modifications['~'];
        template.content.querySelector('.mod-5').innerText = this.modifications['$'];
        template.content.querySelector('.mod-6').innerText = this.modifications[']'];
        template.content.querySelector('.mod-7').innerText = this.modifications['['];
        var clone = window.document.importNode(template.content, true);
        window.$('tbody', '#protein-table').append(clone);

    });

    protein_data_table = window.$('#protein-table').DataTable({
        "paging": false,
        "info": false,
        "order": [[0, "desc"],[4,"desc"],[3,"desc"]],
        "dom": '<"top"<"col-xs-6"B><"col-xs-6">f>',
        "buttons": ['copyHtml5','excelHtml5','pdfHtml5'],
        "columnDefs":[{
            "targets":[8,9,10,11,12,13,14,15],
            "visible": false,
            "searchable": true
        }]
    });

}

function addProteinClick(){
    console.log("DEBUG: adding protein click events");
    window.$('.protein', '#protein-table').click(function(){
        window.$('.success').removeClass('success');
        window.$(this).addClass('success');
        updateProteinInfo(window.$(this).attr('accession-data'));
        //console.log(window.$(this).attr('accession-data'));
    });
}

function updateProteinInfo(accession){
    window.$('tbody', '#scan-table').html('');
    listPeptides(accession);
    updateProteinDetails(accession);
}

function listPeptides(accession) {
    if(window.$.fn.dataTable.isDataTable( '#peptide-table')){
        peptide_table.destroy();
    }
    window.$('tbody', '#peptide-table').html('');
    
    window.$.each(ezf.getPeptides(accession), function () {
        var template = window.document.querySelector('#peptide-tr-template');
        template.content.querySelector('.peptide').setAttribute('peptide-data', this);
        template.content.querySelector('.scan_count').innerText = ezf.getScans(accession, this).length;
        template.content.querySelector('.sequence').innerText = this;
        var clone = window.document.importNode(template.content, true);
        window.$('tbody', '#peptide-table').append(clone);
    })
    addPeptideClick(accession);
}

function addPeptideClick(accession){
    //console.log("DEBUG: adding peptide click events");
    window.$('.peptide', '#peptide-table').click(function(){
        //console.log(window.$(this).attr('accession-data'));
        window.$('.success', '#peptide-table').removeClass('success');
        window.$('.success', '#scan-table').removeClass('success');
        window.$(this).addClass('success');
        window.$('tbody', '#scan-table').html('');
        listScans(accession, window.$(this).attr('peptide-data'));
    });
}

function listScans(accession, sequence){
    window.$.each(ezf.getScans(accession, sequence), function(){
        var template = window.document.querySelector('#scan-tr-template');
        template.content.querySelector('.scan').setAttribute('scan-data', this);
        template.content.querySelector('.name').innerText = this;
        var clone = window.document.importNode(template.content, true);
        window.$('tbody', '#scan-table').append(clone);
    });
    addScanClick();
}

function addScanClick(){
    window.$('tr', '#scan-table').click(function(){
        window.$('.success', '#scan-table').removeClass('success');
        window.$(this).addClass('success');
        updateScanDetails(window.$(this).attr('scan-data'), cntx);
    });
}

function updateScanDetails(scan){
    var template = window.document.querySelector('#scan-details-template');
    template.content.querySelector('#detail-name').innerText = ezf.getScanDetails(scan).name;
    template.content.querySelector('#detail-accession').innerText = ezf.getScanDetails(scan).reference;
    template.content.querySelector('#detail-sequence').innerText = ezf.getScanDetails(scan).match_peptide;
    template.content.querySelector('#detail-pep_prob').innerText = Number(ezf.getScanDetails(scan).peptide_prob).toPrecision(2);
    template.content.querySelector('#detail-pp_discrim').innerText = Number(ezf.getScanDetails(scan).pp_discrim).toPrecision(2);
    template.content.querySelector('#detail-charge').innerText = ezf.getScanDetails(scan).charge;
    template.content.querySelector('#detail-delta_cn').innerText = Number(ezf.getScanDetails(scan).deltaCn).toPrecision(4);
    template.content.querySelector('#detail-mass').innerText = Number(ezf.getScanDetails(scan).mass).toPrecision(9);
    template.content.querySelector('#detail-tic').innerText = Number(ezf.getScanDetails(scan).tic).toPrecision(5);
    var clone = window.document.importNode(template.content, true);
    window.$('.panel-body', '#details').html(clone);

    var ion_core = ezf.getIonCore(scan);
    window.$.each(ion_core, function(i, ions){
        var trTemp = window.document.querySelector('#ion-core-tr');
        trTemp.content.querySelector('.aa').innerText = ions.aa;
        trTemp.content.querySelector('.b-ion').innerText = "b" + (i+1);
        trTemp.content.querySelector('.b-ion-mass').innerText = Number(ions.b_ion).toPrecision(6);
        trTemp.content.querySelector('.y-ion').innerText = "y" + (ion_core.length - i);
        trTemp.content.querySelector('.y-ion-mass').innerText = Number(ions.y_ion).toPrecision(6);
        var trClone = window.document.importNode(trTemp.content, true);
        window.$('tbody', '#ion-core-table').append(trClone);
    });

    window.$('#ion-core-table').hide();
    window.$('#ion-toggle').click(function(){
        window.$('#ion-core-table').toggle();
    });
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
    var template = window.document.querySelector('#protein-details-template');
    template.content.querySelector('#detail-description').innerText = ezf.getProteinDetails(accession).description;
    template.content.querySelector('#detail-max_xcorr').innerText = ezf.getProteinDetails(accession).max_xcorr;
    template.content.querySelector('#detail-total_xcorr').innerText = ezf.getProteinDetails(accession).total_xcorr;
    template.content.querySelector('#detail-total_tic').innerText = ezf.getProteinDetails(accession).total_tic;
    template.content.querySelector('#detail-mwt').innerText = ezf.calculateMonoWeight(accession).toPrecision(4);
    template.content.querySelector('#detail-gravy').innerText = ezf.calculateGravy(accession).toPrecision(5);
    template.content.querySelector('#detail-pi').innerText = ezf.calculatePH(accession).toPrecision(5);
    template.content.querySelector('#detail-coverage').innerText =
    coverage.observed + " of " +
    coverage.total + " aa. " +
    (coverage.coverage * 100).toPrecision(5) + "%";

    var clone = window.document.importNode(template.content, true);
    window.$('.panel-body','#details').html(clone);

    window.$.each(ezf.listAllPeptides(accession), function(){
        var trTemp = window.document.querySelector('#protein-details-peptides-tr');
        trTemp.content.querySelector('td').innerText = this;
        var trClone = window.document.importNode(trTemp.content, true);
        window.$('tbody', '#detail-peptides-table').append(trClone);
    });
}

function addProteinMenu(){

    window.$('.protein', '#protein-table').contextmenu(function(event) {
        event.preventDefault();
        //console.log("clicked at: " + event.pageX + "," + event.pageY);
        var window_offset_x = gui.Window.get(window).x - gui.Window.get().x;
        var window_offset_y = gui.Window.get(window).y - gui.Window.get().y;

        //empty context menu
        emptyMenu(protein_menu);


        var acc = window.$(this).attr('accession-data');
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
    window.$('.panel-body', '#details').html(html);
}

module.exports = {
	openEzView: openEzView
}
