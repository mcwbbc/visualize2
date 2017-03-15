'use strict';

var gui = require('nw.gui');

global.gui = gui;
global.$ = $;
global.console = console;

var ezf = require('./ezf');
var filter = require('./filters');
var peptide_table;
var cntx;
var protein_menu = new global.gui.Menu();
var protein_data_table;

function main(){
    window.$('#open').click(function(event){
        chooseFile('#fileDialog');
    });
    window.$('#quit').click(function(event){
        process.exit(0);
    });
}

function chooseFile(name){
    var chooser = window.$(name);
    chooser.unbind('change');
    chooser.change(function(event){
        console.log(window.$(this).val());
        openEzView(window.$(this).val());
    });

    chooser.trigger('click');
}

function openEzView(file){
    ezf.readEz2(file);
    $('#main').toggle();
    $('#report').toggle(function(){
        global.gui.Window.get().title = "Visualize 2.0: " + file;
        listProteins();
        addProteinClick();
        addProteinMenu();
        addShortCuts();
        addFilterClick();
        addRedundantClick();
        addSaveasClick();
        $('#column-1').resizable({ alsoResizeReverse: "#column-2"});
    });
}

function addSaveasClick(){
    $('#save-file').click(function(){
        var chooser = $('#saveas-dialog');
        chooser.unbind('change');
        chooser.change(function(e){
            console.log($(this).val());
            ezf.saveFile($(this).val());
        });
        chooser.trigger('click');
    });
}

function addSpectraGraphClick(){
    $('#show-spectra').click(function(){
        var name = $('#detail-name').text(); //returns out file name
        var data = ezf.getDtaText(name);
        var dom_canvas = $('#spectraChart');
        var cheight = $(dom_canvas).attr('height');
        var cwidth = $(dom_canvas).attr('width');
        var mz_axis = cheight - 20; //location of mz_axis

        var by_ions = {}; //object to hold spectra for b y ion matching

        if(data !== -1){
            var canvas = new fabric.StaticCanvas('spectraChart'); //turn off object manipulation
            var x_min = 0;
            // create a rectangle object
            var base_line = new fabric.Rect({
                left: 0,
                top: mz_axis,
                width: cwidth,
                height: 1,
                fill: 'black'
            });
            canvas.add(base_line); //add the mz axis

            //add tickmarks
            for(var i = 0; i < cwidth; i += 100/data.max_mz * cwidth){
                canvas.add(new fabric.Rect({
                    left: i,
                    top: mz_axis,
                    height: 10,
                    width: 1,
                    fill: 'black'
                }))
                canvas.add(new fabric.Text(
                    String(Math.round(i * data.max_mz / cwidth)), {
                        fontSize: 10,
                        left: i,
                        top: mz_axis + 10
                    }
                ));
            }

            //TODO determine theoretical intensity for a theoretical peak
            $.each(ezf.getIonCore(name), function(i, ions){
                //var b_rect = new fabric.Rect({ left: ions.b_ion, top: mz_axis - 20,
                //                height: 20, width: 1, fill: 'white', strokeDashArray: [2,1], stroke: 'blue'});
                var b_line = new fabric.Line([ions.b_ion, mz_axis - 20, ions.b_ion, mz_axis], {strokeDashArray: [4,2],
                                                stroke: 'blue'});
                by_ions[Math.round(ions.b_ion)] = b_line;
                canvas.add(b_line);

            });

            //console.log(JSON.stringify(by_ions));
            //console.log(JSON.stringify(data));

            $.each(data.data, function(i, spectrum){
                if(x_min === 0) {
                    x_min = spectrum['x'];
                }

                if(by_ions[Math.round(spectrum['x'])] === undefined){
                    // Draw a spectra line
                    var rect = new fabric.Rect({
                        left: ((spectrum['x']) / data.max_mz) * cwidth,
                        top: mz_axis - (spectrum['y'] / data.max_int) * mz_axis,
                        fill: 'gray',
                        width: 1,
                        height: (spectrum['y'] / data.max_int) * mz_axis
                    });

                    // store the spectra for matching later

                    // "add" rectangle onto canvas
                    canvas.add(rect);
                } else {
                    by_ions[Math.round(spectrum['x'])].set({left: ((spectrum['x']) / data.max_mz) * cwidth,
                        top: mz_axis - (spectrum['y'] / data.max_int) * mz_axis,
                        fill: 'red',
                        width: 1,
                        height: (spectrum['y'] / data.max_int) * mz_axis});
                }

            });
            console.log("max_mz " + data.max_mz + " max int " + data.max_int);
        }
    });
}

function addRedundantClick(){
    $('#redundant').click(function(){
        var template = document.querySelector('#waiting-gif-template');
        var clone = document.importNode(template.content, true);
        var remove = [];
        $('.panel-body', '#details').html(clone);
        $('#waiting-gif').show("fast", function(){
            listRedundantProteins();
            $(this).hide();
            $('.redundant-accession').click(function(){
                var span = $(this);
                if(span.hasClass('bg-danger')){
                    span.removeClass('bg-danger text-muted');
                    for(var i = 0; i < remove.length; i++){
                        if(remove[i] === span.attr('data-accession')){
                            remove.splice(i,1);
                        }
                    }
                } else {
                    span.addClass('bg-danger text-muted');
                    console.log(span.attr('data-accession'));
                    remove.push(span.attr('data-accession'));
                }
            });
            $('#remove-redundant-button').click(function(){
                console.log(remove.join());
                ezf.removeProteins(remove);
                listProteins();
                addProteinClick();
                addProteinMenu();
                removeFilters();
            });
        });
    });
}

function addFilterClick(){
    $('#filter').click(function(){
        $.get('./filters.html', function(html){
            $('.panel-body', '#details').html(html);
            setFilterValues(filter.getProteinProbFilter(),
                filter.getPeptideCountFilter(),
                filter.getScanCountFiler(),
                filter.getModificationFilter(),
                filter.getDecoyFilter());
            enableModificationFilter();
            $('#filter-on').click(function(){
                var protein_val = $('#protein-prob-filter').val();
                var pep_val = $('#pep-count-filter').val();
                var scan_val = $('#scan-count-filter').val();
                var mod_val = $('#modification-filter').val();
                var decoy_prop = $('[name=decoy-cont-filter]').prop('checked');
                filter.setProteinProbFilter(protein_val);
                filter.setPeptideCountFilter(pep_val);
                filter.setScanCountFilter(scan_val);
                filter.setModificationFilter(mod_val);
                filter.setDecoyFilter(decoy_prop);
                protein_data_table.draw();
                var btn = $('#filter');
                btn.addClass('btn-warning');
                setScanTotal();
            });
            $('#filter-off').click(function(){
                removeFilters();
            });
        });
    });
}

function removeFilters(){
    setFilterValues(0,0,0,'', false);
    filter.setPeptideCountFilter(0);
    filter.setProteinProbFilter(0);
    filter.setScanCountFilter(0);
    filter.setDecoyFilter(false);
    if(protein_data_table){ protein_data_table.draw(); }
    var btn = $('#filter');
    btn.removeClass('btn-warning');
    $('button', '#filter-mod-sym').prop('disabled', false);
    $('button', '#filter-mod-logic').prop('disabled', true);
    $('#total_scans_shown').text(100);
}

function enableModificationFilter(){
    var mod_filter = $('#modification-filter');
    $('button', '.mod-filter-group').click(function(){
        var text = mod_filter.val();
        console.log(text);
        text += $(this).text();
        console.log(text);
        mod_filter.val(text);
        $('button', '.mod-filter-group').prop('disabled', function(i, v){ return !v; });
    });
    $('#mod-reset').click(function(){
        mod_filter.val('');
        $('button', '#filter-mod-sym').prop('disabled', false);
        $('button', '#filter-mod-logic').prop('disabled', true);
    });
    return;
}

function setScanTotal(){
    var scans_left = 0;
    $('.scan_count', '.protein').each(function(){
        scans_left += Number($(this).text());
    });
    $('#total_scans_shown').text(Number(100 * scans_left / ezf.totalScans()).toPrecision(2));
    //$('#total_scans_shown').text(Number(scans_left));
}

function setFilterValues(prot, pep, scan, mod, decoy){
    $('#protein-prob-filter').val(prot);
    $('#pep-count-filter').val(pep);
    $('#scan-count-filter').val(scan);
    $('#modification-filter').val(mod);
    $('[name=decoy-cont-filter]').prop('checked', decoy);
}

function addShortCuts(){
    $(document).keydown(function(e){
        if(e.which === 38){ //arrow up
            e.preventDefault();
            var i = getActiveTR();
            if(i > -1) {
                setActiveTR(i - 1);
                updateProteinInfo($('.success', '#protein-table').attr('accession-data'));
            }
        } else if(e.which === 40){ //arrow down
            e.preventDefault();
            var i = getActiveTR();
            if(i > -1) {
                setActiveTR(i + 1);
                updateProteinInfo($('.success', '#protein-table').attr('accession-data'));
            }
        }
    })
}

function getActiveTR(){
    var tr = $('.success', '#protein-table');
    return tr.index();
}

function setActiveTR(index){
    $('.success').removeClass('success');
    if(index >= $('tr', '#protein-table tbody').length){ index = 0;}
    var htmlTR = $('tr', '#protein-table tbody').get(Number(index));
    $(htmlTR).addClass('success');
    htmlTR.scrollIntoView(true);

}

function listProteins(){
    if(!(typeof protein_data_table === 'undefined')){
        protein_data_table.clear();
        protein_data_table.destroy();
        //$('tr', '#protein-table tbody').each(function(){
        //    this.remove();
        //});
    }

    $.each(ezf.getProteins(), function () {
        var template = document.querySelector('#protein-tr-template');
        template.content.querySelector('.protein').setAttribute('accession-data', this.accession);
        template.content.querySelector('.pp').innerText = Number(this.protein_prob).toPrecision(4);
        template.content.querySelector('.name').innerText = this.name;
        template.content.querySelector('.accession').innerText = this.accession;
        template.content.querySelector('.pep_count').innerText = this.peptide_count;
        template.content.querySelector('.scan_count').innerText = this.scan_count;
        template.content.querySelector('.mwt').innerText = ezf.calculateMonoWeight(this.accession).toPrecision(4);
        template.content.querySelector('.pi').innerText = ezf.calculatePH(this.accession).toPrecision(5);
        template.content.querySelector('.gravy').innerText = ezf.calculateGravy(this.accession).toPrecision(5);
        template.content.querySelector('.desc').innerText = this.description;
        template.content.querySelector('.mod-0').innerText = this.modifications['*'];
        template.content.querySelector('.mod-1').innerText = this.modifications['#'];
        template.content.querySelector('.mod-2').innerText = this.modifications['@'];
        template.content.querySelector('.mod-3').innerText = this.modifications['^'];
        template.content.querySelector('.mod-4').innerText = this.modifications['~'];
        template.content.querySelector('.mod-5').innerText = this.modifications['$'];
        template.content.querySelector('.mod-6').innerText = this.modifications[']'];
        template.content.querySelector('.mod-7').innerText = this.modifications['['];
        var clone = document.importNode(template.content, true);
        $('tbody', '#protein-table').append(clone);

    });

    //negative columns count from the right of the table
    var hidden_columns = [];
    for(var i = -1; i > -9; i--){
        hidden_columns.push(i);
    }
    console.log(hidden_columns);

    protein_data_table = $('#protein-table').DataTable({
        "paging": false,
        "info": false,
        "order": [[0, "desc"],[4,"desc"],[3,"desc"]],
        "dom": '<"top"<"col-xs-6"B><"col-xs-6">f>',
        "buttons": ['copyHtml5','excelHtml5','pdfHtml5'],
        "columnDefs":[{
            "targets": hidden_columns,
            "visible": false,
            "searchable": true
        }]
    });

}

function addProteinClick(){
    console.log("DEBUG: adding protein click events");
    $('.protein', '#protein-table').click(function(){
        $('.success').removeClass('success');
        $(this).addClass('success');
        updateProteinInfo($(this).attr('accession-data'));
        //console.log($(this).attr('accession-data'));
    });
}

function updateProteinInfo(accession){
    $('tbody', '#scan-table').html('');
    listPeptides(accession);
    updateProteinDetails(accession);
}

function listPeptides(accession) {
    if($.fn.dataTable.isDataTable( '#peptide-table')){
        peptide_table.destroy();
    }
    $('tbody', '#peptide-table').html('');
    
    $.each(ezf.getPeptides(accession), function () {
        var template = document.querySelector('#peptide-tr-template');
        template.content.querySelector('.peptide').setAttribute('peptide-data', this);
        template.content.querySelector('.scan_count').innerText = ezf.getScans(accession, this).length;
        template.content.querySelector('.sequence').innerText = this;
        var clone = document.importNode(template.content, true);
        $('tbody', '#peptide-table').append(clone);
    });
    sortTable('peptide-table');
    addPeptideClick(accession);
}

function listRedundantProteins(){
    var template = document.querySelector('#redundant-proteins-template');
    var clone = document.importNode(template.content, true);
    $('.panel-body', '#details').html(clone);

    $.each(ezf.getRedundantProteins(), function(protein, results){
        var t2 = document.querySelector('#redundant-protein-template');
        t2.content.querySelector('#protein-name').innerText = "(" + protein + ") " + ezf.getProteinDetails(protein).name;
        t2.content.querySelector('#protein-name').setAttribute('data-accession', protein);
        t2.content.querySelector('#redundant-list').innerText = "";

        var orig_peptides = "";
        $.each(results.peptides, function(k,v){
            orig_peptides += "(" + v + ") " + k + "<br/>";
        });
        t2.content.querySelector('#redundant-list').innerHTML = orig_peptides;


        delete results.peptides;

        $.each(results, function(group, matches){
            if(!(typeof matches === 'undefined')){
                var t3 = document.querySelector('#redundant-peptides-template');
                t3.content.querySelector('#type').innerText = group;
                var match_peptides = "";
                $.each(matches, function(prot, peps){
                    match_peptides += "(" + prot + ") " + ezf.getProteinDetails(prot).name + "<br/><ul>";
                    $.each(peps, function(pep, v){
                        match_peptides += "<li>";
                        if(v.match){
                            match_peptides += " * ";
                        }
                        match_peptides += "(" + v.count + ") " + pep + "</li>"
                    });
                    match_peptides += "</ul>";
                });

                t3.content.querySelector('#redundant-peptides').innerHTML = match_peptides;

                var clone = document.importNode(t3.content, true);
                t2.content.querySelector('#redundant-list').appendChild(clone);
            }
        });
        var clone = document.importNode(t2.content, true);
        $('.panel-body', '#details').append(clone);
    });
}

function addPeptideClick(accession){
    //console.log("DEBUG: adding peptide click events");
    $('.peptide', '#peptide-table').click(function(){
        //console.log($(this).attr('accession-data'));
        $('.success', '#peptide-table').removeClass('success');
        $('.success', '#scan-table').removeClass('success');
        $(this).addClass('success');
        $('tbody', '#scan-table').html('');
        listScans(accession, $(this).attr('peptide-data'));
    });
}

function listScans(accession, sequence){
    $.each(ezf.getScans(accession, sequence), function(){
        var template = document.querySelector('#scan-tr-template');
        template.content.querySelector('.scan').setAttribute('scan-data', this);
        template.content.querySelector('.name').innerText = this;
        var clone = document.importNode(template.content, true);
        $('tbody', '#scan-table').append(clone);
    });
    addScanClick();
}

function addScanClick(){
    $('tr', '#scan-table').click(function(){
        $('.success', '#scan-table').removeClass('success');
        $(this).addClass('success');
        updateScanDetails($(this).attr('scan-data'), cntx);
    });
}

function updateScanDetails(scan){
    var template = document.querySelector('#scan-details-template');
    template.content.querySelector('#detail-name').innerText = ezf.getScanDetails(scan).name;
    template.content.querySelector('#detail-accession').innerText = ezf.getScanDetails(scan).reference;
    template.content.querySelector('#detail-sequence').innerText = ezf.getScanDetails(scan).match_peptide;
    template.content.querySelector('#detail-pep_prob').innerText = Number(ezf.getScanDetails(scan).peptide_prob).toPrecision(2);
    template.content.querySelector('#detail-pp_discrim').innerText = Number(ezf.getScanDetails(scan).pp_discrim).toPrecision(2);
    template.content.querySelector('#detail-charge').innerText = ezf.getScanDetails(scan).charge;
    template.content.querySelector('#detail-delta_cn').innerText = Number(ezf.getScanDetails(scan).deltaCn).toPrecision(4);
    template.content.querySelector('#detail-mass').innerText = Number(ezf.getScanDetails(scan).mass).toPrecision(9);
    template.content.querySelector('#detail-tic').innerText = Number(ezf.getScanDetails(scan).tic).toPrecision(5);
    var clone = document.importNode(template.content, true);
    $('.panel-body', '#details').html(clone);

    var ion_core = ezf.getIonCore(scan);
    $.each(ion_core, function(i, ions){
        var trTemp = document.querySelector('#ion-core-tr');
        trTemp.content.querySelector('.aa').innerText = ions.aa;
        trTemp.content.querySelector('.b-ion').innerText = "b" + (i+1);
        trTemp.content.querySelector('.b-ion-mass').innerText = Number(ions.b_ion).toPrecision(6);
        trTemp.content.querySelector('.y-ion').innerText = "y" + (ion_core.length - i);
        trTemp.content.querySelector('.y-ion-mass').innerText = Number(ions.y_ion).toPrecision(6);
        var trClone = document.importNode(trTemp.content, true);
        $('tbody', '#ion-core-table').append(trClone);
    });

    $('#ion-core-table').hide();
    $('#ion-toggle').click(function(){
        $('#ion-core-table').toggle();
    });
}

function updateProteinDetails(accession){
    var coverage = ezf.calculateCoverage(accession);
    var template = document.querySelector('#protein-details-template');
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

    var clone = document.importNode(template.content, true);
    $('.panel-body','#details').html(clone);

    $.each(ezf.listAllPeptides(accession), function(){
        var trTemp = document.querySelector('#protein-details-peptides-tr');
        trTemp.content.querySelector('td').innerText = this;
        var trClone = document.importNode(trTemp.content, true);
        $('tbody', '#detail-peptides-table').append(trClone);
    });
}

function addProteinMenu(){

    $('.protein', '#protein-table').contextmenu(function(event) {
        event.preventDefault();
        //console.log("clicked at: " + event.pageX + "," + event.pageY);
        var window_offset_x = gui.Window.get(window).x - gui.Window.get().x;
        var window_offset_y = gui.Window.get(window).y - gui.Window.get().y;

        //empty context menu
        emptyMenu(protein_menu);


        var acc = $(this).attr('accession-data');
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
    $.each(menu.items, function(){
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
    $('.panel-body', '#details').html(html);
}


function sortTable(tbl_id){
    //modified from Rob W (http://stackoverflow.com/questions/7558182/sort-a-table-fast-by-its-first-column-with-javascript-or-jquery)
    var tbl = document.getElementById(tbl_id).tBodies[0];
    var store = [];
    for(var i=0, len=tbl.rows.length; i<len; i++){
        var row = tbl.rows[i];
        var sortnr = parseFloat(row.cells[0].textContent || row.cells[0].innerText);
        if(!isNaN(sortnr)) store.push([sortnr, row]);
    }
    store.sort(function(x,y){
        return y[0] - x[0];
    });
    for(var i=0, len=store.length; i<len; i++){
        tbl.appendChild(store[i][1]);
    }
    store = null;
}

main();

