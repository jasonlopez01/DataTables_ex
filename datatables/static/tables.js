$(document).ready(function(){
    var tbl = null;
    function InitTable(raw, ftype){
        //only accepts .txt, .csv, .json, or .xlsx
        //cols dict -- {'data':index or string of col to map data to, 'title': title of col}, json usually str, text usually int
        var data = []
        var cols = []
        if(typeof(raw) == 'object'){
            data = raw
            $.each(raw[0], function(key, val){
                cols.push({'data':key, 'title':key})
            });
        }else if(ftype == '.json'){
            data = JSON.parse(raw)
            $.each(Object.keys(data[0]), function(key,val){
                cols.push({'data':val, 'title':val})
            })
        }else if(ftype == '.txt' || ftype == '.csv'){
            //split creates arrary of rows, shift pops the first row for columns
            splt = raw.split('\n')
            header_str = splt.shift()
            $.each(header_str.split(','),function(key,val){
                if(val){
                    cols.push({'data':key,'title':val})
                }
            })
            $.each(splt, function(key, val){
                if(val){
                    data.push(val.match(/(".*?"|[^",]+)/g))
                }
            })
        }else if(ftype == '.xlsx'){
            var book = XLSX.read(raw, {type:'binary'})
            var sht_name = book.Workbook.Sheets[0].name //only grabs 1st sheet
            data = XLSX.utils.sheet_to_json(book.Sheets[sht_name])
            $.each(data[0], function(key, val){
                cols.push({'data':key, 'title':key})
            });
        };

        if(tbl){
            tbl.destroy()
            $('#tbl').empty()
        }
        tbl = $('#tbl').DataTable({
            data:data,
            columns:cols,
            dom:'Bfrtip',
            colReorder: true,
            select: true,
            buttons: ['copy', 'excel', 'csv', 'pdf', 'print', 'colvis'],
            buttons:[
                {extend:'csv', className:'btn btn-default btn-sm'},
                {extend:'excel', className:'btn btn-default btn-sm'},
                {extend:'pdf', className:'btn btn-default btn-sm'},
                {extend:'print', className:'btn btn-default btn-sm'},
                {extend:'colvis', className:'btn btn-default btn-sm', text:'Columns'}
            ]
        })
    };

     $.ajax({
        dataType:'json',
        url:'/_data-json',
        data: 'data',
        success: function(json){
            InitTable(json,'.json')
        }
    })

    $('#u_file').on('change', function(evt) {
        var f = evt.target.files[0];
        var fileType = f.name.match(/.csv$|.txt$|.json$|.xlsx$/)[0]
        if (fileType) {
            var r = new FileReader();
            r.onload = function(e) {
                InitTable(r.result, fileType)
            }
            //r.readAsText(f); need binary string for xlsx
            r.readAsBinaryString(f)
        } else {
            alert('Failed to load file. Only accepts .txt, .csv, .json, or .xlsx file types');
        }
    });
});