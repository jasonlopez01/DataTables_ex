//get data from datatables columns
//https://stackoverflow.com/questions/27159614/jquery-datatables-get-filtered-column-values
//examples if init with names, tbl.column('symbol:name').data(); tbl.column(':contains(symbol)')

//sparklines docs, and rendering in datatables
//https://omnipotent.net/jquery.sparkline/#s-docs
//https://stackoverflow.com/questions/20875081/properly-rendering-sparklines-in-a-datatable

//importing and handling xlsx data with javascript
//https://github.com/SheetJS/js-xlsx
//https://stackoverflow.com/questions/8238407/how-to-parse-excel-file-in-javascript-html5

//TODO: change init cols to pull from python default cols? Query all, some visible?
var init_cols = [
    {'title': 'Symbol', 'data': 'Symbol'},
    {'title': 'Name', 'data': 'Name'},
    {'title': 'Stock Exchange', 'data': 'Stock Exchange'},
    {'title': 'Market Capitalisation', 'data':'Market Capitalisation'},
    {'title': 'Open', 'data':'Open'},
    {'title': 'Days High', 'data':'Days High'},
    {'title': 'Days Low', 'data':'Days Low'},
    {'title': 'Days Range', 'data':'Days Range'},
    {'title': 'Volume', 'data': 'Volume'},
    {'title': 'Average Daily Volume', 'data':'Average Daily Volume'},
    {'title':'Historic', 'data': 'Historic'}
]
//TODO: Fix sparkline tooltips, see docs
//TODO: Fix sparklin canvas width, set to 750px, where?
$(document).ready(function(){
    tbl = $('#tbl').DataTable({
            //data:data,
            columns:init_cols,
            columnDefs:[
                {'render':function ( data, type, row ) {return '<span class="dynamicsparkline">' + data + '</span>'}, targets:[-1]},
                {targets:'_all', defaultContent:'-'},
                { "width": "5px", "targets": [-1]} //Xpx or X%
            ],
            dom:'Bfrtip',
            colReorder: true,
            select: true,
            //buttons: ['copy', 'excel', 'csv', 'pdf', 'print', 'colvis'],
            buttons:[
                {extend:'copy', className:'btn btn-default btn-sm'},
                {extend:'csv', className:'btn btn-default btn-sm'},
                {extend:'excel', className:'btn btn-default btn-sm'},
                {extend:'pdf', className:'btn btn-default btn-sm'},
                {extend:'print', className:'btn btn-default btn-sm'},
                {extend:'colvis', className:'btn btn-default btn-sm', text:'Columns'}
            ],
            fnDrawCallback: function (oSettings) {
                $('.dynamicsparkline:not(:has(canvas))').sparkline('html', {
                    type: 'line',
                    minSpotColor: 'red',
                    maxSpotColor: 'green',
                    spotColor: false
                    //composite:true //this would redraw a new sparkline on top of an existing one, not best solution for persisting
                    //instead try IDing ones that haven't been drawn, ie spans w/ no canvas tag inside
                });
            }

        })

    function AddRows(json_src){
        data = JSON.parse(json_src)
        tbl.clear()
        tbl.rows.add(data).draw()
    };

    function UploadSymbols(raw, ftype){
        //only accepts .txt, .csv, or .xlsx - and .json from backend
        //output data in [{'ColName': val1},...] (only 1 col)
        tbl.clear().draw()
        var data = []
        if(typeof(raw) == 'object'){
            data = raw
        }else if(ftype == '.json'){
            data = JSON.parse(raw)
        }else if(ftype == '.txt' || ftype == '.csv'){
            //split on new line creates arrary of rows
            splt = raw.split('\n')
            $.each(splt, function(key, val){
                if(val){
                    //then split on comma for multi cols, use first col, and jquery trim, add in a {'ColName':val}
                    data.push({'Symbol': $.trim(val.split(',')[0])})
                }
            })
        }else if(ftype == '.xlsx'){
            var book = XLSX.read(raw, {type:'binary'})
            var sht_name = book.Workbook.Sheets[0].name //only grabs 1st sheet
            pre_csv = XLSX.utils.sheet_to_csv(book.Sheets[sht_name])
            splt = pre_csv.split('\n')
            $.each(splt, function(key, val){
                if(val){
                    data.push({'Symbol' : val.split(',')[0]})
                }
            })
        };
        tbl.rows.add(data) //{'ColName':val}
        tbl.draw()
    };

    $('#u_file').on('change', function(evt) {
        var f = evt.target.files[0];
        var fileType = f.name.match(/.csv$|.txt$|.xlsx$/)
        if (fileType) {
            var r = new FileReader();
            r.onload = function(e) {
                UploadSymbols(r.result, fileType)
            }
            r.readAsBinaryString(f)
        } else {
            alert('Failed to load file. Only accepts .txt, .csv, or .xlsx file types');
        }
    });

    $('#get_stocks').on('click', function(evt){
        var stock_list = []
        tbl.column(0).data().unique().each(function(val, index){stock_list.push(val)})
        $.ajax({
            type : 'POST',
            url : '/_stocks_datapull',
            data: JSON.stringify(stock_list, null, '\t'),
            contentType: 'application/json;charset=UTF-8',
            success: function(result) {
                AddRows(result)
            }
        });
    });

});