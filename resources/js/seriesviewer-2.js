/*******************
 Series Viewer
 *******************/
let parameters, hideEmptyRows = false, allow_weekend = true;

function sel_item(row){
  var datainformations = $('#jqxgrid').jqxGrid('getdatainformation');
  var rowscounts = datainformations.rowscount;
  for(var i=0; i<rowscounts; i++){
    console.log($('#seriesItem_'+i));
    if($('#seriesItem_'+i)[0].checked){
      $('#jqxgrid').jqxGrid('selectrow', i);
    }
  }
  if(!$('#seriesItem_'+row)[0].checked){
    $('#jqxgrid').jqxGrid('unselectrow', row);
  }  
}

window.onload = function () {
    $.jqx.theme = 'light';
    $.jqx.utilities.scrollBarSize = 11;

    // Define all variables
    var toggleMetaData = 1,
        requestedTab = getParameterByName('tab'),
        full_symbol = getParameterByName('symbol'),
        sessionToken = getSession(),
        layout = getParameterByName('layout'),
        datasource = full_symbol.split('/')[0],
        symbol = (full_symbol.split('/').length > 2) ? full_symbol.split('/')[2] : full_symbol.split('/')[1],
        category = (full_symbol.split('/').length > 2) ? full_symbol.split('/')[1] : false,
        isPricesDataLoaded = false,
        correctionsDataAdapter,
        chartSource,
        highlight_weekends = true,
        hasUserAccessToCategory = true,
        layoutURL = !isNaN(parseInt(layout)) ? "&layout=" + layout : "",
        frequency_array = [{
                d: 'Day'
            },
            {
                w: 'Week'
            },
            {
                m: 'Month'
            },
            {
                q: 'Quarter'
            },
            {
                hy: 'Half Year'
            },
            {
                y: 'Year'
            }
        ],
        corrections_count,
        size = 0,
        decimalText = '0004',
        isChartLoaded = false,
        isCorrectionsLoaded = false,
        source = {},
        disabledGrid = false,
        expired = false,
        bates = [],
        corrections_array = [],
        dataAdapter,
        gridMetadata,
        correctionsTab = false,
        data_corr = {},
        userName = '',
        corrections_count = 0,
        hide_data,
        bateStatus = [],
        hide_data_chart,
        showNoValue = true,

        isSubChartLoaded = false,
        toolbar_ready = false,
        rowsData,
        rowsWeekendData;

    function isNumberFunc(n) {
        return /^-?[\d.]+(?:e-?\d+)?$/.test(n) && !isNaN(parseFloat(n));
    }

    var textLength = $("<span class='hidden-text'>");
    $('body').append(textLength);

    function resizeColumns(grid_id) {
        var grid = $("#" + grid_id),
            columns = grid.jqxGrid('columns').records,
            rows = grid.jqxGrid('getrows'),
            gridData = {};

        if (
            columns !== undefined && Array.isArray(columns) && columns.length > 0 &&
            rows !== undefined && Array.isArray(rows) && rows.length > 0
        ) {
            columns.map(column => {
                rows.map(row => {
                    if (column.datafield !== undefined && Object.keys(row).includes(column.datafield)) {
                        if (!Object.keys(gridData).includes(column.datafield))
                            gridData[column.datafield] = [];

                        if (
                            row[column.datafield] == "NA" ||
                            row[column.datafield] == "N/A" ||
                            row[column.datafield] == undefined ||
                            row[column.datafield] == null ||
                            row[column.datafield] == '<span id="NoValue">N/A<span>'
                        ) {
                            gridData[column.datafield].push("0");
                        } else if (
                            column.cellsformat !== undefined && (
                                column.cellsformat.toLowerCase() == "yyyy-mm-dd" ||
                                column.cellsformat.toLowerCase() == "yyyy-mm-dd hh:mm" ||
                                column.cellsformat.toLowerCase() == "yyyy-mm-dd hh:mm:ss")
                        ) {
                            var date = new Date(row[column.datafield]),
                                dd = date.getDate(),
                                MM = date.getMonth() + 1,
                                yy = date.getFullYear(),
                                hh = date.getHours(),
                                mm = date.getMinutes(),
                                ss = date.getSeconds();

                            if (dd < 10) dd = '0' + dd;
                            if (mm < 10) mm = '0' + mm;

                            if (column.cellsformat.toLowerCase() == "yyyy-mm-dd hh:mm:ss")
                                gridData[column.datafield].push(yy + "-" + MM + "-" + dd + " " + hh + ":" + mm + ":" + ss);

                            else if (column.cellsformat.toLowerCase() == "yyyy-mm-dd hh:mm")
                                gridData[column.datafield].push(yy + "-" + MM + "-" + dd + " " + hh + ":" + mm);

                            else
                                gridData[column.datafield].push(yy + "-" + MM + "-" + dd);
                        } else
                            gridData[column.datafield].push(row[column.datafield])
                    }
                });
            });

            for (var k in gridData) {
                gridData[k] = gridData[k].reduce(function (a, b) {
                    return String(a).length > String(b).length ? a : b;
                });

                if (k.toLowerCase() !== "date" && k.toLowerCase() !== "volume" && isNumberFunc(gridData[k]))
                    gridData[k] = parseFloat(gridData[k]).toFixed(real_decimal);

                textLength.text(gridData[k]);
                let valueWidth = textLength.width();
                columns = columns.map(v => {
                    if (v !== undefined && v.datafield == k) {
                        textLength.text(v.text);
                        v.width = textLength.width() > valueWidth ? textLength.width() : valueWidth;
                        v.width += 20;
                    }
                    return v;
                });
            }

            grid.jqxGrid({
                columns: columns
            });
            grid.jqxGrid('refresh');
            // Scroll with JS to row0

        }
    }

    $('#topPanel, #jqxTabs').show();
    $('#jqxTabs').jqxTabs({
        width: '100%',
        height: '100%',
        position: 'top'
    });

    $('#profile').attr('href', 'profile?tab=MyProfile');
    $('#favorites').attr('href', 'profilemain?tab=favorites');
    $('#logout').click(function () {
        logout();
    });

    // Get user data and check if session is not Expired
    call_api_ajax('GetMyAccountDetails', 'get', {
        SessionToken: sessionToken
    }, false, (data) => {
        userName = data.Result.Name;
        $('#username-info').text(userName);
    });

    // Function to register the data
    function enterDate(data, freq = 'd') {
        if (data) {
            console.log(data, freq)
            $('#water').remove();

            if (data.Metadata && data.Metadata.Simulated !== undefined)
                disabledGrid = data.Metadata.Simulated

            corrections_array = data.Corrections;
            //            alert(JSON.stringify(data.BateStatus));

            bateStatus = data.BateStatus;

            let corrections_new_array = [];

            for (var i in corrections_array) {
                for (var x in corrections_array[i]) {
                    corrections_new_array.push({
                        PriceDay: i,
                        Type: corrections_array[i][x][0]['Operation'],
                        Bate: x,
                        OriginalPrice: corrections_array[i][x][0]['Value'],
                        IssuedDate: corrections_array[i][x][0]['IssuedDate'],
                        CorrectedPrice: corrections_array[i][x][0]['CorrectedTo'],
                        AddedToDB: corrections_array[i][x][0]['InsertDateTime']
                    });
                }
            }

            corrections_array = corrections_new_array;
            corrections_array.reverse();

            gridMetadata = data.Metadata;
            if (gridMetadata) {
                //                if (full_symbol.split('/').length < 3 && gridMetadata.Datacategory !== "false") {
                if (full_symbol.split('/').length < 3 && gridMetadata.Datacategory !== undefined) {
                    full_symbol = full_symbol.split('/')
                    full_symbol.splice(1, 0, gridMetadata.Datacategory)
                    full_symbol = full_symbol.join('/');

                    window.history.pushState("datasetsPage", datasource + " database", "/seriesviewer?symbol=" + full_symbol + "&tab=prices" + layoutURL);
                }

                bates = gridMetadata.Bates.map(function (v) {
                    return {
                        name: v,
                        type: 'float'
                    }
                });

                corrections_count = gridMetadata.Corrections;
            }

            rowsData = Object.keys(data.Values).map(function (date) {
                let row = {
                    Date: date
                };
                for (var i in bates) {
                    let num = data.Values[date][i],
                        value = !isNumberFunc(num) ? num : data.Values[date][i].toFixed(bates[i].name.toLowerCase() == "volume" ? 0 : 4);
                    value = (value == 'NA') ? '<span id="NoValue">N/A<span>' : value;
                    row[bates[i].name] = value;
                }
                return row;
            });
          
            if (rowsData.length > 0 && new Date(rowsData[0].Date) < new Date(rowsData[rowsData.length - 1].Date))
                rowsData.reverse();

            hide_data = rowsData.map(function (v) {
                let isEmpty = true;
                for (var i in v) {
                    if (i !== "Date" && v[i] !== null && v[i] !== undefined) {
                        isEmpty = false;
                        break;
                    }
                }
                if (isEmpty) return undefined;
                else return v;
            });

            hide_data = hide_data.filter(function (element) {
                return element !== undefined;
            });

            source.localdata = rowsData;
          if(hideEmptyRows == true){
            if (new Date(hide_data[0].Date) < new Date(hide_data[hide_data.length - 1].Date))
              hide_data.reverse();
            source.localdata = hide_data;
            //$("#jqxgrid").jqxGrid('updatebounddata', 'cells');
          }
            if (chartSource !== undefined) chartSource.localdata = rowsData;

            if (gridMetadata.Datacategory !== undefined && gridMetadata.Datacategory !== "false") {
                $('.categoryExist').show();
                $('#category-info').text(gridMetadata.Datacategory);
            }
            $('#contract-info').text(gridMetadata.Name);
            $('#datasource-info').text(gridMetadata.Datasource);
            $('#symbol-info').text(gridMetadata.Symbol);
            $('#startDate-info').text(gridMetadata.StartDate);
            $('#endDate-info').text(gridMetadata.EndDate);
            $('#frequency-info').text(frequency_array[freq]);
            $('#additional-data-info').text(gridMetadata.Description);
            $('#corrections-info').text(corrections_count);
            $('#num-rows-info').text(Object.keys(rowsData).length);
            $("#jqxgrid").jqxGrid('updatebounddata', 'cells');

            if (correctionsTab)
                $("#jqxgridCorrections").jqxGrid('updatebounddata', 'cells');

            $("#jqxgridCorrectionDetails").jqxGrid('updatebounddata', 'cells');
            $("#jqxgrid").jqxGrid('hideloadelement');
            $("#jqxgridCorrectionDetails").jqxGrid('hideloadelement');

            if (rowsData.length == 0) {
                $('head').append('<style id="water" type="text/css">.watermark.access::before { content: "No data available"; opacity: 1; color: #999 } #row0jqxgrid { opacity: 0 } </style>');
            }
        }
    }
    // Fetch data if it is not registered
    if (sessionStorage.getItem(full_symbol) === null) {
        console.log("ST is null: ", full_symbol, sessionStorage.getItem(full_symbol))
        let Series;
        if (category !== false) Series = [{
            Datasource: datasource,
            Symbol: symbol,
            Datacategory: category
        }];
        else Series = [{
            Datasource: datasource,
            Symbol: symbol
        }];
        parameters = {
            SessionToken: sessionToken,
            Frequency: "d",
            Series: Series,
            Sparse: true,
            SparseOptions: {
                Leading: true,
                Values: false,
                Trailing: true
            },
            ReturnMetadata: true,
            ReturnBateStatus: true,
        };
                 
        call_api_ajax('GetDatasetValues', 'POST', JSON.stringify(parameters), false, (data, textStatus, XmlHttpRequest) => {

            if (data.Result.Series[0].length == 0 || data.Result.Series[0].Values == undefined) {
                let type = 'Metadata or BateStatus';
                if (data.Result.Series[0].Metadata == undefined) type = 'Metadata';
                else if (data.Result.Series[0].BateStatus == undefined) type = 'BateStatus';
                else if (data.Result.Series[0].Values == undefined) type = 'Values';

                dialogWindow('The server responded with "' + XmlHttpRequest.status + '" but cannot read the ' + type + ' field', 'error');
                console.warn(data);
                return;
            } else if (data.Result.Series[0].BateStatus !== undefined && data.Result.Series[0].BateStatus.Status > 299) {
                dialogWindow('Server returned: ' + data.Result.Series[0].BateStatus.Status + '. No access to the data series requested', 'error');
                console.warn(data);
                return;
            } else {
              console.log('data.Result', data.Result)
                enterDate(data.Result.Series[0]); // Register the data
            }
        });
      
      parameters_weekend = {
        SessionToken: sessionToken,
        Frequency: "d",
        Series: Series,
        Sparse: true,
        SparseOptions: {
          Leading: true,
          Values: false,
          Trailing: true
        },
        FrequencyOptions: {
          AllowWeekends:"off"
        }
        //AllowWeekends:"on"
      };
      
      call_api_ajax('GetDatasetValuesRC', 'POST', JSON.stringify(parameters_weekend), false, (data, textStatus, XmlHttpRequest) => {

            rowsWeekendData = Object.keys(data.Result.Rows).map(function (date) {
              let row = {Date: date};
              //console.log(data.Result.Rows[date]);
              let num = data.Result.Rows[date][0];
              //value = !isNumberFunc(num) ? num : "";
              //console.log(num);
              row['Close'] = num;
              return row;
            });
        
        if (rowsWeekendData.length > 0 && new Date(rowsWeekendData[0].Date) < new Date(rowsWeekendData[rowsWeekendData.length - 1].Date))
          rowsWeekendData.reverse();

      });
    } else {
        sessionStorage.removeItem(full_symbol);

        console.log("ST removed: ", full_symbol, sessionStorage.getItem(full_symbol))
        let Series;
        if (category !== false) Series = [{
            Datasource: datasource,
            Symbol: symbol,
            Datacategory: category
        }];
        else Series = [{
            Datasource: datasource,
            Symbol: symbol
        }];
        parameters = {
            SessionToken: sessionToken,
            Frequency: "d",
            Series: Series,
            Sparse: true,
            SparseOptions: {
                Leading: true,
                Values: false,
                Trailing: true
            },
            ReturnMetadata: true,
            ReturnBateStatus: true
        };
        console.log(parameters);

        call_api_ajax('GetDatasetValues', 'POST', JSON.stringify(parameters), false, (data, textStatus, XmlHttpRequest) => {

            if (data.Result.Series[0].length == 0 || data.Result.Series[0].Values == undefined) {
                let type = 'Metadata or BateStatus';
                if (data.Result.Series[0].Metadata == undefined) type = 'Metadata';
                else if (data.Result.Series[0].BateStatus == undefined) type = 'BateStatus';
                else if (data.Result.Series[0].Values == undefined) type = 'Values';

                dialogWindow('The server responded with "' + XmlHttpRequest.status + '" but cannot read the ' + type + ' field', 'error');
                console.warn(data);
                return;
            } else if (data.Result.Series[0].BateStatus !== undefined && data.Result.Series[0].BateStatus.Status > 299) {
                dialogWindow('Server returned: ' + data.Result.Series[0].BateStatus.Status + '. No access to the data series requested', 'error');
                console.warn(data);
                return;
            } else {
                enterDate(data.Result.Series[0]); // Register the data
            }
        });
    }


    if (bateStatus.length > 0) {
        let e = false;
        var h = '<div class="dialog-font-report hd-server">Warnings from server:</div><div class="c-grid">',
            t = $('<table class="dialog-font-report" id="ignoreBate">'),
            th = $('<tr><th>SYMBOL</th><th>Bate</th><th>Code</th><th>Detail</th></tr>');
        t.append(th);

        for (var i in bateStatus) {
            if (bateStatus[i].Status !== 200) {
                e = true;
                t.append('<tr><td>' + symbol + '</td><td>' + bateStatus[i].Bate + '</td><td>' + bateStatus[i].Status + '</td><td>' + bateStatus[i].Details + '</td></tr>');
            }
        }

        if (e) {
            h += t[0].outerHTML + '</div>';
            dialogWindow(h, "warning", null, 'Server API Messages');
        }
    }

    var access = '',
        last_access;
    call_api_ajax('GetUserDatasources', 'get', {
        SessionToken: sessionToken,
        ReturnCategoryList: true
    }, false, (data) => {
        data.Result.map((v) => {
            access = (v.Datasource == datasource) ? v : access;
        });
    });

    console.log(access)

    if (access.Details !== undefined && access.Details.Ends !== undefined) {
        if (isDateExpired(access.Details.Ends, true)) {
            expired = true;
            last_access = access.Details.Ends;
        }
    } else if (access.DetailsDS !== undefined && access.DetailsDS.UserCategoryList !== undefined && gridMetadata.Datacategory !== undefined) {
        access.DetailsDS.UserCategoryList.map((v) => {
            if (v.Name == gridMetadata.Datacategory) {
                if (isDateExpired(v.UserAccess.Ends, true)) {
                    expired = true;
                    last_access = v.UserAccess.Ends;
                }
            }
        });
    }

    if (expired == true && rowsData.length !== 0 && !disabledGrid) {
        $(".status-bar").show().find("#status-info").text("Access expired on " + last_access);
        $('head').append('<style type="text/css">.watermark.access::before { content: "Access expired on ' + last_access + '"; } </style>');
    } else if (expired && disabledGrid) {
        $(".status-bar").show().find("#status-info").text("Simulated values, Access expired on " + last_access);
    } else if (disabledGrid) {
        $(".status-bar").show().find("#status-info").text("Simulated values");
    }

    bates.push({
        name: 'Date',
        type: 'date'
    });
    bates.push({
        name: 'corrected',
        type: 'boolean'
    });
    bates.push({
        name: 'correction_count',
        type: 'float'
    });
    bates.push({
        name: 'correction_bates'
    });
  
    // Load the prices to show it in the table
    function loadPricesData(autoBind, async) {
        isPricesDataLoaded = true;
        source = {
            datatype: "json",
            datafields: bates,
            localdata: rowsData
        };
        dataAdapter = new $.jqx.dataAdapter(source, {
            autoBind: autoBind,
            async: async,
            downloadComplete: function () {},
            loadComplete: function () {},
            loadError: function () {}
        });
    }

    // If the prices are not loaded, load it
    if (!isPricesDataLoaded) {
        loadPricesData(false, true);
    }



    $('#jqxTabs').on('selected', function (event) {
        var tab;
        switch (event.args.item) {
            case 0:
                tab = "prices";
                break
            case 1:
                tab = "chart";
                if (!isChartLoaded) {
                    isChartLoaded = true;
                    createChart(rowsData);
                }
                break
            case 2:
                tab = "corrections";
                if (!isCorrectionsLoaded) {
                    isCorrectionsLoaded = true;
                    loadCorrections(true, gridMetadata, corrections_array);
                }
                break
        }
        window.history.pushState("datasetsPage", datasource + " database", "/seriesviewer?symbol=" + full_symbol + "&tab=" + tab);
    });

    var getDate = function (date) {
        var today = date,
            dd = today.getDate(),
            mm = today.getMonth() + 1,
            yyyy = today.getFullYear();

        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }
        return yyyy + '-' + mm + '-' + dd;
    };

    var cellclass = function (row, columnfield, value, rowdata) {
            if (Object.keys(data_corr).includes(getDate(rowdata.Date))) {
                let data = data_corr[getDate(rowdata.Date)];
                if (data !== undefined) {
                    if (data.date !== undefined && (data.column.includes(columnfield) || columnfield == ''))
                        if (getDate(rowdata.Date) == getDate(data.date))
                            return "corr_selected";
                }
            }
            if (rowdata.Date !== undefined && (rowdata.Date.getDay() == 6 || rowdata.Date.getDay() == 0) && highlight_weekends)
                return "highlightBG";
        },
        dateclass = function (row, columnfield, value, rowdata) {
            let className = "";
          console.log('rowdata', rowdata);
            if (Object.keys(data_corr).includes(getDate(rowdata.Date))) {
                let data = data_corr[getDate(rowdata.Date)];
                if (data !== undefined) {
                    if (data.date !== undefined && (data.column.includes(columnfield) || columnfield == ''))
                        if (getDate(rowdata.Date) == getDate(data.date))
                            className = "corr_selected";
                }
            }
            if (highlight_weekends) {
                let date = new Date(value);
                if (date.getDay() == 6 || date.getDay() == 0)
                    className = className !== "" ? className + " highlightWeekends" : "highlightWeekends";
            }

            if (className !== "") return className;
        },
        cellsrendererRows = function (row, column, value, defaulthtml, columnproperties, rowdata) {
            value = !isNumberFunc(value) ? value : parseFloat(value).toFixed(column.toLowerCase() == "volume" ? 0 : real_decimal);
            value = (value == 'NA') ? '<span id="NoValue">N/A<span>' : value;
            return '<div class="v-row" style="margin-top: 6px; margin-right: 4px; text-align: right; width: auto">' + value + '</div>';
        }

    var cols;
    var columns = [{
            text: '#',
            sortable: false,
            filterable: false,
            editable: false,
            cellsalign: 'right',
            align: 'right',
            groupable: false,
            draggable: false,
            resizable: false,
            datafield: '',
            columntype: 'number',
            width: 50,
            cellclassname: cellclass,
            cellsrenderer: function (row, column, value, defaulthtml, columnproperties, rowdata) {
                return "<div style='margin:4px; margin-top: 6px;text-align:right'>" + (value + 1) + "</div>";
              //return "<input type='checkbox' id='seriesItem_"+value+"' style='margin-top: 8px; text-align:right; margin-left:20px;' onclick='sel_item("+row+")'/>";
            }
        },
        {
            text: 'Date',
            datafield: 'Date',
            filtertype: 'range',
          editable: false,
            cellsformat: 'yyyy-MM-dd',
            cellsalign: 'center',
            align: 'center',
            cellclassname: dateclass,
          cellsrenderer: function (row, column, value, defaulthtml, columnproperties, rowdata) {
                return "<div style='margin:4px; margin-top: 6px;text-align:right'>" + defaulthtml + "</div>";
            }
        },
    ];
  
    for (var i in bates) {
        let name = bates[i].name;
        name = name.split("(calculated)").join("(c)");

        if (name == "Adjusted_Close")
            name = "Adj. Close";

        if (!["Date", "corrected", "correction_count", "correction_bates"].includes(bates[i].name))
            columns.push({
                text: name,
                datafield: bates[i].name,
                filtertype: "float",
                cellsalign: 'right',
              editable: false,
                align: 'center',
                cellclassname: cellclass,
                cellsrenderer: cellsrendererRows
            });
    }

    if (corrections_count !== 0) {
        columns.push({
            text: '# Corrections',
            datafield: 'correction_count',
            hidden: true,
            cellsalign: 'center',
            align: 'center',
            cellclassname: cellclass
        });
    }
  
    // Create the table
    $("#jqxgrid").jqxGrid({
        width: '100%',
        height: '100%',
      editable: true,
      editmode: 'click',
        source: dataAdapter,
        columns: columns,
        columnsresize: true,
        sortable: true,
        altrows: true,
        showtoolbar: true,
        filterable: true,
        clipboard: false,
        enablebrowserselection: false,
        columnsreorder: true,
        deferreddatafields: ['date'],
        selectionmode: 'multiplerowsadvanced',
        toolbarheight: 37,
        ready: function () // If the table is ready
        {
            // Make resize for columns
            cols = $("#jqxgrid").jqxGrid("columns");

            let y = [];
            for (c in cols.records) {
                if (cols.records[c].text !== "#" && cols.records[c].text !== "Date" && !cols.records[c].hidden)
                    y.push(cols.records[c].text);
            }

            $('#cols').text(y.join(', '));

            if (!hasUserAccessToCategory) {
                $("#jqxgridCorrectionDetails #contentjqxgridCorrectionDetails").addClass("mat");
                $(".chartContainer").addClass("mat");
            }

            // Hide load message ("Requesting Data...")
            $("#jqxgrid").jqxGrid('hideloadelement');
            //$("#jqxgrid").toggleClass('watermark', disabledGrid);
            if (expired && !disabledGrid) $("#jqxgrid").toggleClass('watermark access', expired);

            resizeColumns('jqxgrid');
        },
        rendertoolbar: function (toolbar) // Create the customer toolbar
        {
          
          if(hideEmptyRows == true){
            if (new Date(hide_data[0].Date) < new Date(hide_data[hide_data.length - 1].Date))
              hide_data.reverse();
            source.localdata = hide_data;
            $("#jqxgrid").jqxGrid('updatebounddata', 'cells');
          }
          
            var container = $("<div id='seriesToolbar'></div>");
            toolbar.append(container);

            $("#seriesToolbar").jqxToolBar({
                width: '100%',
                height: 36,
                tools: 'dropdownlist | custom custom custom | custom | custom custom custom custom custom',
                initTools: function (type, index, tool, menuToolIninitialization) {
                    switch (index) {
                        case 0:
                            var frequency = [{
                                    name: 'Day',
                                    value: 'Day'
                                },
                                {
                                    name: 'Week',
                                    value: 'Week'
                                },
                                {
                                    name: 'Month',
                                    value: 'Month'
                                },
                                {
                                    name: 'Quarter',
                                    value: 'Quarter'
                                },
                                {
                                    name: 'Half Year',
                                    value: 'HalfYear'
                                },
                                {
                                    name: 'Year',
                                    value: 'Year'
                                }
                            ];

                            tool.jqxDropDownList({
                                source: frequency,
                                displayMember: "name",
                                valueMember: "value",
                                height: 24,
                                placeHolder: "Average",
                                selectedIndex: 0
                            });
                            tool.attr("id", "series_frequency");

                            // When select item from dropmenu
                            tool.on('select', function (event) {
                                var args = event.args;
                                $('#frequency-info').text(args.item.value);

                                if (args) {
                                    let freq = args.item.value.replace(/[^A-Z]/g, '').toLowerCase();

                                    // function deleteElement(id){
                                    //     let elem = document.getElementById(id);	
                                    //     if (elem){
                                    //         padre = elem.parentNode;
                                    //         padre.removeChild(elem);
                                    //     }
                                    // }

                                    parameters.Frequency = freq;
                                  if(allow_weekend == false){
                                    parameters.FrequencyOptions= {
                                      AllowWeekends:"off"
                                    }
                                  }
                                    
                                    $("#jqxgrid").jqxGrid('showloadelement');
                                    $("#jqxgridCorrectionDetails").jqxGrid('showloadelement');

                                    setTimeout(() => {
                                      console.log(parameters)
                                        call_api_ajax('GetDatasetValues', 'POST', JSON.stringify(parameters), true, (data) => {
                                            //alert(JSON.stringify(data.Result.Series[0]));
                                            enterDate(data.Result.Series[0], freq);
                                            updateChart(rowsData, isChartLoaded, isSubChartLoaded);

                                        }, null, () => {
                                            $("#jqxgrid").jqxGrid('hideloadelement');
                                            $("#jqxgridCorrectionDetails").jqxGrid('hideloadelement');
                                        });
                                    }, 5);


                                    // else {
                                    //     parameters = {
                                    //         SessionToken: sessionToken,
                                    //         Frequency: freq,
                                    //         Series: [{
                                    //             Datasource: datasource,
                                    //             Symbol: symbol
                                    //         }],
                                    //         Sparse: true
                                    //     }
                                    // }

                                    /*                                            parameters = {
                                                                                SessionToken: sessionToken,
                                                                                Frequency: freq,
                                                                                Series: [{
                                                                                    Datasource: datasource,
                                                                                    Symbol: symbol
                                                                                }],
                                                                                Sparse: "leadtrail"
                                                                            }
                                    */


                                }                              
                            });
                            break;
                        case 1:
                            var button = $('<input class="btnlayers" id="btnLayout1" type="button">');
                            tool.append(button)
                            tool.attr("class", "left-toolbar-button");
                            button.jqxButton({
                                imgSrc: "resources/css/icons/layout_1.png",
                                imgPosition: "center",
                                width: 25,
                                height: 24,
                                imgWidth: 16,
                                imgHeight: 18
                            });
                            tool.on('click', function () {
                                $('#bottomSplitter').jqxSplitter('collapse');
                                $('#pricesSplitter').jqxSplitter('collapse');
                                window.history.pushState("datasetsPage", datasource + " database", "/seriesviewer?symbol=" + full_symbol + "&tab=prices&layout=1");
                            });
                            break;
                        case 2:
                            var button = $('<input class="btnlayers" id="btnLayout2" type="button">');
                            tool.append(button);
                            tool.attr("class", "left-toolbar-button");
                            button.jqxButton({
                                imgSrc: "resources/css/icons/layout_2.png",
                                imgPosition: "center",
                                width: 25,
                                height: 24,
                                imgWidth: 16,
                                imgHeight: 18
                            });
                            tool.on('click', function () {
                                if (!isSubChartLoaded) {
                                    isSubChartLoaded = true;
                                    createSubChart(rowsData);
                                }
                                $('#bottomSplitter').jqxSplitter('collapse');
                                $('#pricesSplitter').jqxSplitter('expand');
                                window.history.pushState("datasetsPage", datasource + " database", "/seriesviewer?symbol=" + full_symbol + "&tab=prices&layout=2");
                            });
                            break;
                        case 3:
                            var button = $('<input class="btnlayers" id="btnLayout3" type="button">');
                            tool.append(button);
                            tool.attr("class", "left-toolbar-button");
                            button.jqxButton({
                                imgSrc: "resources/css/icons/layout_3.png",
                                imgPosition: "center",
                                width: 25,
                                height: 24,
                                imgWidth: 16,
                                imgHeight: 18
                            });
                            tool.on('click', function () {
                                $('#bottomSplitter').jqxSplitter('expand');
                                $('#pricesSplitter').jqxSplitter('expand');
                                window.history.pushState("datasetsPage", datasource + " database", "/seriesviewer?symbol=" + full_symbol + "&tab=prices&layout=3");
                                if (!isSubChartLoaded) {
                                    isSubChartLoaded = true;
                                    createSubChart(rowsData);
                                }
                            });
                            break;
                        case 4:
                            var button = $('<button id="decimal"><span id="decimal-style">0</span>.<span id="decimalContent">00</span></button>');
                            tool.append(button);
                        tool.attr("class", "left-toolbar-button");
                            button.jqxButton({
                                imgPosition: "center",
                                width: 'auto',
                                height: 24
                            });
                            var frame = $('<div class="popup-win" style="text-align:center; width:100%">');
                            var msg = $('<div style="float: left;margin-left: 24px;padding: 5px 0;">Decimal Places </div><input id="decimal-input" class="deci2" type="text" readonly>');
                            var btns = $("<div style='float:right;margin-top:-4px;margin-right: 16px;'>")
                            var button1 = $('<div id="btnSpinnUp" title="" class="jqx-rc-all jqx-rc-all-light jqx-button jqx-button-light jqx-widget jqx-widget-light jqx-fill-state-normal jqx-fill-state-normal-light" role="button" aria-disabled="false" style="height: 15px; width: 21px; box-sizing: border-box; position: relative; overflow: hidden;"><img src="resources/css/images/icon-up.png" width="16" height="16" style="display: inline; position: absolute; left:2px; top: 0;"><span style="display: none; position: absolute; left: 9.5px; top: 5px;"></span></div>');
                            var button2 = $('<div id="btnSpinnDown" title="" class="jqx-rc-all jqx-rc-all-light jqx-button jqx-button-light jqx-widget jqx-widget-light jqx-fill-state-normal jqx-fill-state-normal-light" role="button" aria-disabled="false" style="height: 15px; width: 21px; box-sizing: border-box; position: relative; overflow: hidden;"><img src="resources/css/images/icon-down.png" width="16" height="16" style="display: inline; position: absolute; left:2px; top: 0;"><span style="display: none; position: absolute; left: 9.5px; top: 5px;"></span></div>');
                            var buttons = $('<div class="ui-dialog-buttonpane ui-widget-content ui-helper-clearfix"><div class="ui-dialog-buttonset"><button type="button" class="bb-ok ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" style="margin-right:10px;padding-top: 4px;padding-bottom: 4px;" role="button"><span class="ui-button-text">Ok</span></button><button type="button" style="padding-top: 4px;padding-bottom: 4px;" class="bb-cancel ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button"><span class="ui-button-text">Cancel</span></button></div></div>');
                            btns.append(button1);
                            btns.append(button2);
                            frame.append(msg);
                            frame.append(btns);
                            frame.append(buttons);
                            $("body").append(frame);

                            tool.on("click", function () {
                                frame.css({
                                    left: button.offset().left,
                                    top: button.offset().top + 24
                                }).toggle(frame.css('display') == 'none').find('.deci2').val('0.' + decimalText);
                                decimalNumber = real_decimal;
                            });
                            break;

                        case 5:
                            /*var button = $('<input class="btnlayers" id="btnExportPrices" type="button">');
                            tool.append(button);
                            button.jqxButton({
                                imgSrc: "resources/css/icons/filesave.png",
                                imgPosition: "left",
                                width: 25,
                                height: 24,
                                textPosition: "right"
                            });
                            tool.jqxTooltip({
                                content: 'Export the data to local machine',
                                position: 'mouse',
                                name: 'movieTooltip'
                            });
                            tool.on('click', function () {
                                if (!hasUserAccessToCategory)
                                    return;

                                makeExportSeriesDialog();
                            });*/
                            break;



                            // case 6:
                            //     var button = $('<input class="btnlayers" id="btnAutosizeSeries" type="button">');
                            //     tool.append(button);
                            //     tool.attr('class', 'right-toolbar-button');
                            //     button.jqxButton({
                            //         imgSrc: "resources/css/icons/reload.png",
                            //         imgPosition: "center",
                            //         width: 25,
                            //         height: 24,
                            //         imgWidth: 16,
                            //         imgHeight: 16
                            //     });
                            //     tool.jqxTooltip({
                            //         content: 'Refresh Grid',
                            //         position: 'mouse',
                            //         name: 'movieTooltip'
                            //     });
                            //     tool.on("click", function () {
                            //         let freq = $("#frequency-info").text().replace(/[^A-Z]/g, '').toLowerCase();
                            //         parameters.Frequency = freq;
                            //         /*                                        parameters = {
                            //                                                     SessionToken: sessionToken,
                            //                                                     Frequency: freq,
                            //                                                     Series: [{
                            //                                                         Datasource: datasource,
                            //                                                         Symbol: symbol
                            //                                                     }],
                            //                                                     Sparse: "leadtrail"
                            //                                                 }
                            //         */
                            //         $("#jqxgrid").jqxGrid('showloadelement');
                            //         $("#jqxgridCorrectionDetails").jqxGrid('showloadelement');
                            //         setTimeout(() => {
                            //             call_api_ajax('GetDatasetValues', 'POST', JSON.stringify(parameters), true, (data) => {
                            //                 enterDate(data.Result.Series[0], freq);
                            //                 updateChart(rowsData, isChartLoaded, isSubChartLoaded);

                            //             }, null, () => {
                            //                 $("#jqxgrid").jqxGrid('hideloadelement');
                            //                 $("#jqxgridCorrectionDetails").jqxGrid('hideloadelement');
                            //             });
                            //         }, 5);
                            //     });
                            //     break;



                            // case 7:
                            //     var button = $('<input class="btnlayers" id="hideRows" type="button">');
                            //     tool.append(button);
                            //     tool.attr('class', 'right-toolbar-button');
                            //     button.jqxButton({
                            //         imgSrc: "resources/css/icons/HideRows3_16.png",
                            //         imgPosition: "center",
                            //         width: 25,
                            //         height: 24,
                            //         imgWidth: 16,
                            //         imgHeight: 16
                            //     });
                            //     tool.jqxTooltip({
                            //         content: 'Hide rows with no values',
                            //         position: 'mouse',
                            //         name: 'movieTooltip'
                            //     });
                            //     tool.on('click', function () {
                            //         if (showNoValue) {
                            //             if (new Date(hide_data[0].Date) < new Date(hide_data[hide_data.length - 1].Date))
                            //                 hide_data.reverse();
                            //             source.localdata = hide_data;
                            //             showNoValue = false;
                            //             $("#hideRows").jqxTooltip({
                            //                 content: 'Show rows with no values'
                            //             });
                            //         } else {
                            //             if (new Date(rowsData[0].Date) < new Date(rowsData[rowsData.length - 1].Date))
                            //                 rowsData.reverse();
                            //             source.localdata = rowsData;
                            //             showNoValue = true;
                            //             $("#hideRows").jqxTooltip({
                            //                 content: 'Hide rows with no values'
                            //             });
                            //         }

                            //         $("#jqxgrid").jqxGrid('updatebounddata', 'cells');
                            //     });
                            //     break;

                            // case 8:
                            //     var button = $('<input class="btnlayers" id="btnAutosizeSeries" type="button">');
                            //     tool.append(button);
                            //     tool.attr('class', 'right-toolbar-button');
                            //     button.jqxButton({
                            //         imgSrc: "resources/css/icons/autosize.png",
                            //         imgPosition: "center",
                            //         width: 25,
                            //         height: 24,
                            //         imgWidth: 16,
                            //         imgHeight: 16
                            //     });
                            //     tool.jqxTooltip({
                            //         content: 'Autosize columns',
                            //         position: 'mouse',
                            //         name: 'movieTooltip'
                            //     });

                            //     tool.on("click", function () {
                            //         //let position = $("#jqxgrid").jqxGrid("scrollposition");
                            //         resizeColumns('jqxgrid');
                            //         //$("#jqxgrid").jqxGrid("scrolloffset", position.top, position.left)
                            //     });
                            //     break;


                            // case 9:
                            //     var button = $('<input class="btnlayers" id="fullWidth1" type="button">');
                            //     tool.append(button);
                            //     tool.attr('class', 'right-toolbar-button');
                            //     button.jqxButton({
                            //         imgSrc: "resources/css/icons/fullscreen.png",
                            //         imgPosition: "center",
                            //         width: 25,
                            //         height: 24,
                            //         imgWidth: 16,
                            //         imgHeight: 16
                            //     });
                            //     tool.jqxTooltip({
                            //         content: 'Toggle grid to full screen width',
                            //         position: 'mouse',
                            //         name: 'movieTooltip'
                            //     });
                            //     fullWidthFlag = true;
                            //     tool.on('click', function () {
                            //         let img = (fullWidthFlag) ? 'fullscreen1' : 'fullscreen';

                            //         button.jqxButton({
                            //             imgSrc: "resources/css/icons/" + img + ".png",
                            //             imgPosition: "left",
                            //             width: 25,
                            //             textPosition: "right"
                            //         });
                            //         $(".fixpage").toggleClass('fullscreen', fullWidthFlag);
                            //         $("section .wrap").toggleClass('fullscreen', fullWidthFlag);

                            //         fullWidthFlag = !fullWidthFlag;
                            //         window.dispatchEvent(new Event('resize'));
                            //     });
                            //     break;
                    }
                }
            });

            $('#seriesToolbar').append('<div id="right-toolbar-content"></div>')
            $("#seriesToolbar #right-toolbar-content").jqxToolBar({
                width: '100%',
                height: 36,
                tools: 'dropdownlist | custom custom custom | custom',
                initTools: function (type, index, tool, menuToolIninitialization) {

                    switch (index) {
                        case 1:
                            /*var button = $('<input class="btnlayers" id="btnAutosizeSeries" type="button">');
                            tool.append(button);
                            tool.attr('class', 'right-toolbar-button');
                            button.jqxButton({
                                imgSrc: "resources/css/icons/reload.png",
                                imgPosition: "center",
                                width: 25,
                                height: 24,
                                imgWidth: 16,
                                imgHeight: 16
                            });
                            tool.jqxTooltip({
                                content: 'Refresh Grid',
                                position: 'mouse',
                                name: 'movieTooltip'
                            });
                            tool.on("click", function () {
                                let freq = $("#frequency-info").text().replace(/[^A-Z]/g, '').toLowerCase();
                                parameters.Frequency = freq;
                                /*                                        parameters = {
                                                                            SessionToken: sessionToken,
                                                                            Frequency: freq,
                                                                            Series: [{
                                                                                Datasource: datasource,
                                                                                Symbol: symbol
                                                                            }],
                                                                            Sparse: "leadtrail"
                                                                        }
                                */
                                /*$("#jqxgrid").jqxGrid('showloadelement');
                                $("#jqxgridCorrectionDetails").jqxGrid('showloadelement');
                                setTimeout(() => {
                                    call_api_ajax('GetDatasetValues', 'POST', JSON.stringify(parameters), true, (data) => {
                                        enterDate(data.Result.Series[0], freq);
                                        updateChart(rowsData, isChartLoaded, isSubChartLoaded);

                                    }, null, () => {
                                        $("#jqxgrid").jqxGrid('hideloadelement');
                                        $("#jqxgridCorrectionDetails").jqxGrid('hideloadelement');
                                    });
                                }, 5);
                            });*/
                            break;



                        case 2:
                        var button = $('<div id="hideDropdown"></div>');
                            tool.append(button);
                        tool.attr('class', 'right-toolbar-button hideDropdown_arrow');
                        var icons = ['resources/css/icons/hide-rows_16.png', 'resources/css/icons/weekend_16.png', 'resources/css/icons/filesave.png', 'resources/css/icons/reload.png'];
                        var hideDropdownData = [{
                                    name: 'Hide Empty Rows',
                                    value: 'hide',
                                },
                                {
                                    name: 'Allow Weekends',
                                    value: 'weekends',
                                },
                                {
                                    name: 'Export Data',
                                    value: 'export',
                                },
                                {
                                    name: 'Refresh Data',
                                    value: 'refresh',
                                }
                            ];

                            tool.jqxDropDownList({
                                source: hideDropdownData,
                                displayMember: "name",
                                valueMember: "value",
                                height: 24,
                              width:170,
                              dropDownHeight: 112,
                                placeHolder: '<img height="17" width="17" src="resources/css/icons/starDis_16.png">',
                              renderer: function (index, label, DatasourceInfo) {
                                if (!DatasourceInfo)
                                  return label;
                                
                                imgurl = DatasourceInfo.icon;
                                
                                if(index<2){
                                  //var checked = (getCookie('series-data-item-'+index) && getCookie('series-data-item-'+index) == 'true') ? ' checked="checked"' : '';
                                  var checked = (index == 1) ? ' checked="checked"' : '';
                                  return '<input type="checkbox" id="checkbox'+index+'" style="margin-right:3px; vertical-align:middle"'+checked+'/><img height="17" width="17" src="' + icons[index] + '"> <span id="databaseDropdown-lable"> ' + label + '</span>';
                                }
                                else{
                                  return '<img height="17" width="17" src="' + icons[index] + '" style="margin-left:15px;"> <span id="databaseDropdown-lable"> ' + label + '</span>';
                                }
                              },
                              selectionRenderer: function (element, index, label, DatasourceInfo) {
                                if(index == 0 || index == 1 ){
                                  if(index == 0){
                                    if($('#checkbox'+index)[0].checked == true){
                                      setTimeout(() => {
                                        $('#checkbox'+index)[0].checked = false;
                                        hideEmptyRows = false;
                                        //setCookie('series-data-item-'+index, $('#checkbox'+index)[0].checked);
                                      }, 5);                                    
                                    }
                                    else{
                                      setTimeout(() => {
                                        $('#checkbox'+index)[0].checked = true;
                                        hideEmptyRows = true;
                                        //setCookie('series-data-item-'+index, $('#checkbox'+index)[0].checked);
                                      }, 5);
                                    }
                                  }else{
                                    dialogWindow("Changing this setting to "+((allow_weekend==true) ? "off":"on")+" requires a server data refresh. <br/>Do you want to continue?", "query", "confirm", "Monitor+ - Allow Weekends", () => {
                                      if($('#checkbox'+index)[0].checked == true){
                                        setTimeout(() => {
                                          $('#checkbox'+index)[0].checked = false;
                                          allow_weekend = false;
                                          
                                          /*call_api_ajax('GetDatasetValuesRC', 'POST', JSON.stringify(parameters_weekend), false, (data, textStatus, XmlHttpRequest) => {

                                            console.log(data.Result.Rows)
                                            rowsWeekendData = Object.keys(data.Result.Rows).map(function (date) {
                                              let row = {Date: date};
                                              //console.log(data.Result.Rows[date]);
                                              let num = data.Result.Rows[date][0];
                                              //value = !isNumberFunc(num) ? num : "";
                                              //console.log(num);
                                              row['Close'] = num;
                                              row['Value'] = num;
                                              return row;
                                            });

                                            if (rowsWeekendData.length > 0 && new Date(rowsWeekendData[0].Date) < new Date(rowsWeekendData[rowsWeekendData.length - 1].Date))
                                              rowsWeekendData.reverse();
                                            
                                            source.localdata = rowsWeekendData;
                                          });*/
                                          
                                          parameters.FrequencyOptions= {
                                            AllowWeekends:"off"
                                          }
                                          
                                          $("#jqxgrid").jqxGrid('showloadelement');
                                          $("#jqxgridCorrectionDetails").jqxGrid('showloadelement');

                                          call_api_ajax('GetDatasetValues', 'POST', JSON.stringify(parameters), true, (data) => {
                                            //alert(JSON.stringify(data.Result.Series[0]));
                                            enterDate(data.Result.Series[0], parameters.Frequency);
                                            updateChart(rowsData, isChartLoaded, isSubChartLoaded);

                                          }, null, () => {
                                            $("#jqxgrid").jqxGrid('hideloadelement');
                                            $("#jqxgridCorrectionDetails").jqxGrid('hideloadelement');
                                          });
                                        }, 5);
                                      }
                                      else{
                                        setTimeout(() => {
                                          $('#checkbox'+index)[0].checked = true;
                                          allow_weekend = true;
                                          parameters.FrequencyOptions= {
                                            AllowWeekends:"on"
                                          }
                                          
                                          $("#jqxgrid").jqxGrid('showloadelement');
                                          $("#jqxgridCorrectionDetails").jqxGrid('showloadelement');

                                          call_api_ajax('GetDatasetValues', 'POST', JSON.stringify(parameters), true, (data) => {
                                            //alert(JSON.stringify(data.Result.Series[0]));
                                            enterDate(data.Result.Series[0], parameters.Frequency);
                                            updateChart(rowsData, isChartLoaded, isSubChartLoaded);

                                          }, null, () => {
                                            $("#jqxgrid").jqxGrid('hideloadelement');
                                            $("#jqxgridCorrectionDetails").jqxGrid('hideloadelement');
                                          });
                                        }, 5);
                                      }
                                      
                                      setTimeout(() => {
                                        $("#jqxgrid").jqxGrid('updatebounddata', 'cells');
                                      }, 100); 
                                    }, null, null, { Ok: "Yes", Cancel: "No" });
                                  }
                                  
                                  
                                  if(index == 0){
                                    setTimeout(() => {
                                      if($('#checkbox'+index)[0].checked == true){
                                        if (new Date(hide_data[0].Date) < new Date(hide_data[hide_data.length - 1].Date))
                                          hide_data.reverse();
                                        source.localdata = hide_data;
                                      }
                                      else{
                                        if (new Date(hide_data[0].Date) < new Date(hide_data[hide_data.length - 1].Date))
                                          rowsData.reverse();
                                        source.localdata = rowsData;
                                      }
                                    }, 20);
                                    
                                    setTimeout(() => {
                                      $("#jqxgrid").jqxGrid('updatebounddata', 'cells');
                                    }, 100); 
                                  }   
                                }
                                else if(index == 2){
                                  if (!hasUserAccessToCategory)
                                        return;

                                  makeExportSeriesDialog();
                                }
                                else if(index == 3){
                                  let freq = $("#frequency-info").text().replace(/[^A-Z]/g, '').toLowerCase();
                                parameters.Frequency = freq;
                                /*                                        parameters = {
                                                                            SessionToken: sessionToken,
                                                                            Frequency: freq,
                                                                            Series: [{
                                                                                Datasource: datasource,
                                                                                Symbol: symbol
                                                                            }],
                                                                            Sparse: "leadtrail"
                                                                        }
                                */
                                $("#jqxgrid").jqxGrid('showloadelement');
                                $("#jqxgridCorrectionDetails").jqxGrid('showloadelement');
                                setTimeout(() => {
                                    call_api_ajax('GetDatasetValues', 'POST', JSON.stringify(parameters), true, (data) => {
                                        enterDate(data.Result.Series[0], freq);
                                        updateChart(rowsData, isChartLoaded, isSubChartLoaded);

                                    }, null, () => {
                                        $("#jqxgrid").jqxGrid('hideloadelement');
                                        $("#jqxgridCorrectionDetails").jqxGrid('hideloadelement');
                                    });
                                }, 5);
                                }
                                
                                imgurl = 'resources/css/icons/setting_16.png';

                                //                        return '<img height="17" width="17" src="'+ DatasourceInfo.Icon +'" class="seletedItemStyle"> <img height="17" width="17" src="' + imgurl + '" id="selectedItemDropMenu" class="seletedItemStyle"> <span id="datasource-label">' + label + '</span>';
                                return '<img height="17" width="17" src="' + imgurl + '" id="selectedItemDropMenu" class="seletedItemStyle" valign="center">';
                              }
                            });
                        /*tool.on('click', function (event) {
                          $('.jqx-listbox').css('height', '50px');
                        });*/
                        
                            //tool.attr("id", "hideDropdown");
                        //tool.attr("id", "series_frequency");

                            // When select item from dropmenu
                            tool.on('select', function (event) {
                                var args = event.args;
                                //$('#frequency-info').text(args.item.value);

                                /*if (args) {
                                    let freq = args.item.value.replace(/[^A-Z]/g, '').toLowerCase();

                                    parameters.Frequency = freq;

                                    $("#jqxgrid").jqxGrid('showloadelement');
                                    $("#jqxgridCorrectionDetails").jqxGrid('showloadelement');

                                    setTimeout(() => {
                                        call_api_ajax('GetDatasetValues', 'POST', JSON.stringify(parameters), true, (data) => {
                                            //alert(JSON.stringify(data.Result.Series[0]));
                                            enterDate(data.Result.Series[0], freq);
                                            updateChart(rowsData, isChartLoaded, isSubChartLoaded);

                                        }, null, () => {
                                            $("#jqxgrid").jqxGrid('hideloadelement');
                                            $("#jqxgridCorrectionDetails").jqxGrid('hideloadelement');
                                        });
                                    }, 5);

                                }*/
                            });
                            /*var button = $('<div id="hideDropdown"></div>');
                            tool.append(button);
                            tool.attr('class', 'right-toolbar-button');
                            button.jqxButton({
                                imgSrc: "resources/css/icons/HideRows3_16.png",
                                imgPosition: "center",
                                width: 25,
                                height: 24,
                                imgWidth: 16,
                                imgHeight: 16
                            });
                            tool.jqxTooltip({
                                content: 'Hide rows with no values',
                                position: 'mouse',
                                name: 'movieTooltip'
                            });
                            tool.on('click', function () {
                                if (showNoValue) {
                                    if (new Date(hide_data[0].Date) < new Date(hide_data[hide_data.length - 1].Date))
                                        hide_data.reverse();
                                    source.localdata = hide_data;
                                    showNoValue = false;
                                    $("#hideRows").jqxTooltip({
                                        content: 'Show rows with no values'
                                    });
                                } else {
                                    if (new Date(rowsData[0].Date) < new Date(rowsData[rowsData.length - 1].Date))
                                        rowsData.reverse();
                                    source.localdata = rowsData;
                                    showNoValue = true;
                                    $("#hideRows").jqxTooltip({
                                        content: 'Hide rows with no values'
                                    });
                                }

                                $("#jqxgrid").jqxGrid('updatebounddata', 'cells');
                            });*/
                            break;

                        case 3:
                            var button = $('<input class="btnlayers" id="btnAutosizeSeries" type="button" style="margin-right:7px">');
                            tool.append(button);
                            tool.attr('class', 'right-toolbar-button');
                            button.jqxButton({
                                imgSrc: "resources/css/icons/autosize.png",
                                imgPosition: "center",
                                width: 25,
                                height: 24,
                                imgWidth: 16,
                                imgHeight: 16
                            });
                            tool.jqxTooltip({
                                content: 'Autosize columns',
                                position: 'mouse',
                                name: 'movieTooltip'
                            });

                            tool.on("click", function () {
                                //let position = $("#jqxgrid").jqxGrid("scrollposition");
                                resizeColumns('jqxgrid');
                                //$("#jqxgrid").jqxGrid("scrolloffset", position.top, position.left)
                            });
                            break;


                        case 4:
                            var button = $('<input class="btnlayers" id="fullWidth1" type="button">');
                            tool.append(button);
                            tool.attr('class', 'right-toolbar-button');
                            button.jqxButton({
                                imgSrc: "resources/css/icons/fullscreen.png",
                                imgPosition: "center",
                                width: 25,
                                height: 24,
                                imgWidth: 16,
                                imgHeight: 16
                            });
                            tool.jqxTooltip({
                                content: 'Toggle grid to full screen width',
                                position: 'mouse',
                                name: 'movieTooltip'
                            });
                            fullWidthFlag = true;
                            tool.on('click', function () {
                                let img = (fullWidthFlag) ? 'fullscreen1' : 'fullscreen';

                                button.jqxButton({
                                    imgSrc: "resources/css/icons/" + img + ".png",
                                    imgPosition: "left",
                                    width: 25,
                                    textPosition: "right"
                                });
                                $(".fixpage").toggleClass('fullscreen', fullWidthFlag);
                                $("section .wrap").toggleClass('fullscreen', fullWidthFlag);

                                fullWidthFlag = !fullWidthFlag;
                                window.dispatchEvent(new Event('resize'));
                            });
                            break;
                    }
                }
            });














            // $('#seriesToolbar').append('<div id="left-toolbar-content"></div>')
            // $('#seriesToolbar').append('<div id="right-toolbar-content"></div>')


            // let seriesFrequency = `<select name="" id="series_frequency">
            //                         <option value="Day">Day</option>
            //                         <option value="Week">Week</option>
            //                         <option value="Month">Month</option>
            //                         <option value="Year">Year</option>
            //                        </select>`
            // $("#seriesToolbar #left-toolbar-content").append(seriesFrequency);
            // $('#left-toolbar-content #series_frequency').change( function (event) {
            //     console.log(this.value)
            //         var args = event.args;
            //         console.log(args)
            //         //$('#frequency-info').text(args.item.value);

            //         if (args) {
            //             let freq = args.item.value.replace(/[^A-Z]/g, '').toLowerCase();

            //             // function deleteElement(id){
            //             //     let elem = document.getElementById(id);	
            //             //     if (elem){
            //             //         padre = elem.parentNode;
            //             //         padre.removeChild(elem);
            //             //     }
            //             // }

            //             console.log(parameters)
            //             parameters.Frequency = freq;
            //             // } catch (err) {
            //             //     console.log(err)
            //             //     console.log(parameters)
            //             //     parameters = {
            //             //         SessionToken: sessionToken,
            //             //         Frequency: freq,
            //             //         Series: Series,
            //             //         Sparse: true,
            //             //         SparseOptions: {
            //             //         Leading: true,
            //             //         Values: false,
            //             //         Trailing: true
            //             //         },
            //             //         ReturnMetadata:true,
            //             //         ReturnBateStatus:true
            //             //     };
            //             // } 
            //             console.log(parameters)

            //             $("#jqxgrid").jqxGrid('showloadelement');
            //             $("#jqxgridCorrectionDetails").jqxGrid('showloadelement');

            //             setTimeout(() => {
            //                 call_api_ajax('GetDatasetValues', 'POST', JSON.stringify(parameters), true, (data) => {
            //                     //alert(JSON.stringify(data.Result.Series[0]));
            //                     enterDate(data.Result.Series[0], freq);
            //                     updateChart(rowsData, isChartLoaded, isSubChartLoaded);

            //                 }, null, () => {
            //                     $("#jqxgrid").jqxGrid('hideloadelement');
            //                     $("#jqxgridCorrectionDetails").jqxGrid('hideloadelement');
            //                 });
            //             }, 5);


            //             // else {
            //             //     parameters = {
            //             //         SessionToken: sessionToken,
            //             //         Frequency: freq,
            //             //         Series: [{
            //             //             Datasource: datasource,
            //             //             Symbol: symbol
            //             //         }],
            //             //         Sparse: true
            //             //     }
            //             // }

            //             /*                                            parameters = {
            //                                                         SessionToken: sessionToken,
            //                                                         Frequency: freq,
            //                                                         Series: [{
            //                                                             Datasource: datasource,
            //                                                             Symbol: symbol
            //                                                         }],
            //                                                         Sparse: "leadtrail"
            //                                                     }
            //             */


            //         }
            //     });

            // $("#seriesToolbar #left-toolbar-content").jqxToolBar({
            //     width: '100%',
            //     height: 37,
            //     tools: 'dropdownlist | custom custom custom | custom | custom custom custom custom custom',
            //     initTools: function (type, index, tool, menuToolIninitialization) {

            //         switch (index) {
            //             case 0:
            //                 var frequency = [{
            //                         name: 'Day',
            //                         value: 'Day'
            //                     },
            //                     {
            //                         name: 'Week',
            //                         value: 'Week'
            //                     },
            //                     {
            //                         name: 'Month',
            //                         value: 'Month'
            //                     },
            //                     {
            //                         name: 'Quarter',
            //                         value: 'Quarter'
            //                     },
            //                     {
            //                         name: 'Half Year',
            //                         value: 'HalfYear'
            //                     },
            //                     {
            //                         name: 'Year',
            //                         value: 'Year'
            //                     }
            //                 ];

            //                 tool.jqxDropDownList({
            //                     source: frequency,
            //                     displayMember: "name",
            //                     valueMember: "value",
            //                     height: 24,
            //                     placeHolder: "Average",
            //                     selectedIndex: 0
            //                 });
            //                 tool.attr("id", "series_frequency");

            //                 // When select item from dropmenu
            //                 tool.on('select', function (event) {
            //                     var args = event.args;
            //                     $('#frequency-info').text(args.item.value);

            //                     if (args) {
            //                         let freq = args.item.value.replace(/[^A-Z]/g, '').toLowerCase();

            //                         // function deleteElement(id){
            //                         //     let elem = document.getElementById(id);	
            //                         //     if (elem){
            //                         //         padre = elem.parentNode;
            //                         //         padre.removeChild(elem);
            //                         //     }
            //                         // }

            //                         console.log(parameters)
            //                         parameters.Frequency = freq;
            //                         // } catch (err) {
            //                         //     console.log(err)
            //                         //     console.log(parameters)
            //                         //     parameters = {
            //                         //         SessionToken: sessionToken,
            //                         //         Frequency: freq,
            //                         //         Series: Series,
            //                         //         Sparse: true,
            //                         //         SparseOptions: {
            //                         //         Leading: true,
            //                         //         Values: false,
            //                         //         Trailing: true
            //                         //         },
            //                         //         ReturnMetadata:true,
            //                         //         ReturnBateStatus:true
            //                         //     };
            //                         // } 
            //                         console.log(parameters)

            //                         $("#jqxgrid").jqxGrid('showloadelement');
            //                         $("#jqxgridCorrectionDetails").jqxGrid('showloadelement');

            //                         setTimeout(() => {
            //                             call_api_ajax('GetDatasetValues', 'POST', JSON.stringify(parameters), true, (data) => {
            //                                 //alert(JSON.stringify(data.Result.Series[0]));
            //                                 enterDate(data.Result.Series[0], freq);
            //                                 updateChart(rowsData, isChartLoaded, isSubChartLoaded);

            //                             }, null, () => {
            //                                 $("#jqxgrid").jqxGrid('hideloadelement');
            //                                 $("#jqxgridCorrectionDetails").jqxGrid('hideloadelement');
            //                             });
            //                         }, 5);


            //                         // else {
            //                         //     parameters = {
            //                         //         SessionToken: sessionToken,
            //                         //         Frequency: freq,
            //                         //         Series: [{
            //                         //             Datasource: datasource,
            //                         //             Symbol: symbol
            //                         //         }],
            //                         //         Sparse: true
            //                         //     }
            //                         // }

            //                         /*                                            parameters = {
            //                                                                     SessionToken: sessionToken,
            //                                                                     Frequency: freq,
            //                                                                     Series: [{
            //                                                                         Datasource: datasource,
            //                                                                         Symbol: symbol
            //                                                                     }],
            //                                                                     Sparse: "leadtrail"
            //                                                                 }
            //                         */


            //                     }
            //                 });
            //                 break;
            //             case 1:
            //                 var button = $('<input class="btnlayers" id="btnLayout1" type="button">');
            //                 tool.append(button)
            //                 tool.attr("class", "left-toolbar-button");
            //                 button.jqxButton({
            //                     imgSrc: "resources/css/icons/layout_1.png",
            //                     imgPosition: "center",
            //                     width: 25,
            //                     height: 24,
            //                     imgWidth: 16,
            //                     imgHeight: 18
            //                 });
            //                 tool.on('click', function () {
            //                     $('#bottomSplitter').jqxSplitter('collapse');
            //                     $('#pricesSplitter').jqxSplitter('collapse');
            //                     window.history.pushState("datasetsPage", datasource + " database", "/seriesviewer?symbol=" + full_symbol + "&tab=prices&layout=1");
            //                 });
            //                 break;
            //             case 2:
            //                 var button = $('<input class="btnlayers" id="btnLayout2" type="button">');
            //                 tool.append(button);
            //                 tool.attr("class", "left-toolbar-button");
            //                 button.jqxButton({
            //                     imgSrc: "resources/css/icons/layout_2.png",
            //                     imgPosition: "center",
            //                     width: 25,
            //                     height: 24,
            //                     imgWidth: 16,
            //                     imgHeight: 18
            //                 });
            //                 tool.on('click', function () {
            //                     if (!isSubChartLoaded) {
            //                         isSubChartLoaded = true;
            //                         createSubChart(rowsData);
            //                     }
            //                     $('#bottomSplitter').jqxSplitter('collapse');
            //                     $('#pricesSplitter').jqxSplitter('expand');
            //                     window.history.pushState("datasetsPage", datasource + " database", "/seriesviewer?symbol=" + full_symbol + "&tab=prices&layout=2");
            //                 });
            //                 break;
            //             case 3:
            //                 var button = $('<input class="btnlayers" id="btnLayout3" type="button">');
            //                 tool.append(button);
            //                 tool.attr("class", "left-toolbar-button");
            //                 button.jqxButton({
            //                     imgSrc: "resources/css/icons/layout_3.png",
            //                     imgPosition: "center",
            //                     width: 25,
            //                     height: 24,
            //                     imgWidth: 16,
            //                     imgHeight: 18
            //                 });
            //                 tool.on('click', function () {
            //                     $('#bottomSplitter').jqxSplitter('expand');
            //                     $('#pricesSplitter').jqxSplitter('expand');
            //                     window.history.pushState("datasetsPage", datasource + " database", "/seriesviewer?symbol=" + full_symbol + "&tab=prices&layout=3");
            //                     if (!isSubChartLoaded) {
            //                         isSubChartLoaded = true;
            //                         createSubChart(rowsData);
            //                     }
            //                 });
            //                 break;
            //             case 4:
            //                 var button = $('<button id="decimal"><span id="decimal-style">0</span>.<span id="decimalContent">00</span></button>');
            //                 tool.append(button);
            //                 button.jqxButton({
            //                     imgPosition: "center",
            //                     width: 'auto',
            //                     height: 24
            //                 });
            //                 var frame = $('<div class="popup-win" style="text-align:center; width:100%">');
            //                 var msg = $('<div style="float: left;margin-left: 24px;padding: 5px 0;">Decimal Places </div><input id="decimal-input" class="deci2" type="text" readonly>');
            //                 var btns = $("<div style='float:right;margin-top:-4px;margin-right: 16px;'>")
            //                 var button1 = $('<div id="btnSpinnUp" title="" class="jqx-rc-all jqx-rc-all-light jqx-button jqx-button-light jqx-widget jqx-widget-light jqx-fill-state-normal jqx-fill-state-normal-light" role="button" aria-disabled="false" style="height: 15px; width: 21px; box-sizing: border-box; position: relative; overflow: hidden;"><img src="resources/css/images/icon-up.png" width="16" height="16" style="display: inline; position: absolute; left:2px; top: 0;"><span style="display: none; position: absolute; left: 9.5px; top: 5px;"></span></div>');
            //                 var button2 = $('<div id="btnSpinnDown" title="" class="jqx-rc-all jqx-rc-all-light jqx-button jqx-button-light jqx-widget jqx-widget-light jqx-fill-state-normal jqx-fill-state-normal-light" role="button" aria-disabled="false" style="height: 15px; width: 21px; box-sizing: border-box; position: relative; overflow: hidden;"><img src="resources/css/images/icon-down.png" width="16" height="16" style="display: inline; position: absolute; left:2px; top: 0;"><span style="display: none; position: absolute; left: 9.5px; top: 5px;"></span></div>');
            //                 var buttons = $('<div class="ui-dialog-buttonpane ui-widget-content ui-helper-clearfix"><div class="ui-dialog-buttonset"><button type="button" class="bb-ok ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" style="margin-right:10px;padding-top: 4px;padding-bottom: 4px;" role="button"><span class="ui-button-text">Ok</span></button><button type="button" style="padding-top: 4px;padding-bottom: 4px;" class="bb-cancel ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button"><span class="ui-button-text">Cancel</span></button></div></div>');
            //                 btns.append(button1);
            //                 btns.append(button2);
            //                 frame.append(msg);
            //                 frame.append(btns);
            //                 frame.append(buttons);
            //                 $("body").append(frame);

            //                 tool.on("click", function () {
            //                     frame.css({
            //                         left: button.offset().left,
            //                         top: button.offset().top + 24
            //                     }).toggle(frame.css('display') == 'none').find('.deci2').val('0.' + decimalText);
            //                     decimalNumber = real_decimal;
            //                 });
            //                 break;

            //             case 5:
            //                 var button = $('<input class="btnlayers" id="btnExportPrices" type="button">');
            //                 tool.append(button);
            //                 button.jqxButton({
            //                     imgSrc: "resources/css/icons/filesave.png",
            //                     imgPosition: "left",
            //                     width: 25,
            //                     height: 24,
            //                     textPosition: "right"
            //                 });
            //                 tool.jqxTooltip({
            //                     content: 'Export the data to local machine',
            //                     position: 'mouse',
            //                     name: 'movieTooltip'
            //                 });
            //                 tool.on('click', function () {
            //                     if (!hasUserAccessToCategory)
            //                         return;

            //                     makeExportSeriesDialog();
            //                 });
            //                 break;




            //         }
            //     }
            // });



            // $("#seriesToolbar #right-toolbar-content").jqxToolBar({
            //     width: '100%',
            //     height: 37,
            //     tools: 'dropdownlist | custom custom custom | custom | custom custom custom custom custom',
            //     initTools: function (type, index, tool, menuToolIninitialization) {

            //         switch (index) {
            //             case 1:
            //                 var button = $('<input class="btnlayers" id="btnAutosizeSeries" type="button">');
            //                 tool.append(button);
            //                 tool.attr('class', 'right-toolbar-button');
            //                 button.jqxButton({
            //                     imgSrc: "resources/css/icons/reload.png",
            //                     imgPosition: "center",
            //                     width: 25,
            //                     height: 24,
            //                     imgWidth: 16,
            //                     imgHeight: 16
            //                 });
            //                 tool.jqxTooltip({
            //                     content: 'Refresh Grid',
            //                     position: 'mouse',
            //                     name: 'movieTooltip'
            //                 });
            //                 tool.on("click", function () {
            //                     let freq = $("#frequency-info").text().replace(/[^A-Z]/g, '').toLowerCase();
            //                     parameters.Frequency = freq;
            //                     /*                                        parameters = {
            //                                                                 SessionToken: sessionToken,
            //                                                                 Frequency: freq,
            //                                                                 Series: [{
            //                                                                     Datasource: datasource,
            //                                                                     Symbol: symbol
            //                                                                 }],
            //                                                                 Sparse: "leadtrail"
            //                                                             }
            //                     */
            //                     $("#jqxgrid").jqxGrid('showloadelement');
            //                     $("#jqxgridCorrectionDetails").jqxGrid('showloadelement');
            //                     setTimeout(() => {
            //                         call_api_ajax('GetDatasetValues', 'POST', JSON.stringify(parameters), true, (data) => {
            //                             enterDate(data.Result.Series[0], freq);
            //                             updateChart(rowsData, isChartLoaded, isSubChartLoaded);

            //                         }, null, () => {
            //                             $("#jqxgrid").jqxGrid('hideloadelement');
            //                             $("#jqxgridCorrectionDetails").jqxGrid('hideloadelement');
            //                         });
            //                     }, 5);
            //                 });
            //                 break;



            //             case 2:
            //                 var button = $('<input class="btnlayers" id="hideRows" type="button">');
            //                 tool.append(button);
            //                 tool.attr('class', 'right-toolbar-button');
            //                 button.jqxButton({
            //                     imgSrc: "resources/css/icons/HideRows3_16.png",
            //                     imgPosition: "center",
            //                     width: 25,
            //                     height: 24,
            //                     imgWidth: 16,
            //                     imgHeight: 16
            //                 });
            //                 tool.jqxTooltip({
            //                     content: 'Hide rows with no values',
            //                     position: 'mouse',
            //                     name: 'movieTooltip'
            //                 });
            //                 tool.on('click', function () {
            //                     if (showNoValue) {
            //                         if (new Date(hide_data[0].Date) < new Date(hide_data[hide_data.length - 1].Date))
            //                             hide_data.reverse();
            //                         source.localdata = hide_data;
            //                         showNoValue = false;
            //                         $("#hideRows").jqxTooltip({
            //                             content: 'Show rows with no values'
            //                         });
            //                     } else {
            //                         if (new Date(rowsData[0].Date) < new Date(rowsData[rowsData.length - 1].Date))
            //                             rowsData.reverse();
            //                         source.localdata = rowsData;
            //                         showNoValue = true;
            //                         $("#hideRows").jqxTooltip({
            //                             content: 'Hide rows with no values'
            //                         });
            //                     }

            //                     $("#jqxgrid").jqxGrid('updatebounddata', 'cells');
            //                 });
            //                 break;

            //             case 3:
            //                 var button = $('<input class="btnlayers" id="btnAutosizeSeries" type="button">');
            //                 tool.append(button);
            //                 tool.attr('class', 'right-toolbar-button');
            //                 button.jqxButton({
            //                     imgSrc: "resources/css/icons/autosize.png",
            //                     imgPosition: "center",
            //                     width: 25,
            //                     height: 24,
            //                     imgWidth: 16,
            //                     imgHeight: 16
            //                 });
            //                 tool.jqxTooltip({
            //                     content: 'Autosize columns',
            //                     position: 'mouse',
            //                     name: 'movieTooltip'
            //                 });

            //                 tool.on("click", function () {
            //                     //let position = $("#jqxgrid").jqxGrid("scrollposition");
            //                     resizeColumns('jqxgrid');
            //                     //$("#jqxgrid").jqxGrid("scrolloffset", position.top, position.left)
            //                 });
            //                 break;


            //             case 4:
            //                 var button = $('<input class="btnlayers" id="fullWidth1" type="button">');
            //                 tool.append(button);
            //                 tool.attr('class', 'right-toolbar-button');
            //                 button.jqxButton({
            //                     imgSrc: "resources/css/icons/fullscreen.png",
            //                     imgPosition: "center",
            //                     width: 25,
            //                     height: 24,
            //                     imgWidth: 16,
            //                     imgHeight: 16
            //                 });
            //                 tool.jqxTooltip({
            //                     content: 'Toggle grid to full screen width',
            //                     position: 'mouse',
            //                     name: 'movieTooltip'
            //                 });
            //                 fullWidthFlag = true;
            //                 tool.on('click', function () {
            //                     let img = (fullWidthFlag) ? 'fullscreen1' : 'fullscreen';

            //                     button.jqxButton({
            //                         imgSrc: "resources/css/icons/" + img + ".png",
            //                         imgPosition: "left",
            //                         width: 25,
            //                         textPosition: "right"
            //                     });
            //                     $(".fixpage").toggleClass('fullscreen', fullWidthFlag);
            //                     $("section .wrap").toggleClass('fullscreen', fullWidthFlag);

            //                     fullWidthFlag = !fullWidthFlag;
            //                     window.dispatchEvent(new Event('resize'));
            //                 });
            //                 break;
            //         }
            //     }
            // });



























            $(document).on('click', '.bb-ok', function () {
                real_decimal = decimalNumber;

                setTimeout(() => {
                    $("#jqxgrid").jqxGrid('updatebounddata', 'cells');
                    $("#jqxgridCorrectionDetails").jqxGrid('updatebounddata', 'cells');

                    if (correctionsTab)
                        $("#jqxgridCorrections").jqxGrid('updatebounddata', 'cells');
                }, 5);

                $('.popup-win').hide();
                resizeColumns('jqxgrid');
            });

            $(document).on('click', '.bb-cancel', function () {
                $('.popup-win').hide();
                decimalNumber = real_decimal;
            });

            $(document).on('click', '#btnSpinnUp', function () {
                if (decimalNumber == 9)
                    return;

                decimalNumber++;
                decimalText = '';
                for (var i = 0; i < decimalNumber - 1; i++)
                    decimalText += '0';

                decimalText += decimalNumber;
                $(".deci2").val('0.' + decimalText);
            });

            // Decrease the decimal number
            $(document).on('click', '#btnSpinnDown', function () {
                if (decimalNumber == 1)
                    return;

                decimalNumber--;

                decimalText = '';
                for (var i = 0; i < decimalNumber - 1; i++)
                    decimalText += '0';

                decimalText += decimalNumber;
                $(".deci2").val('0.' + decimalText);
            });
        }
    });

/*$("#jqxgrid").bind('cellendedit', function (event) {
  if (event.args.value) {
		$("#jqxgrid").jqxGrid('selectrow', event.args.rowindex);
	}
	else {
		$("#jqxgrid").jqxGrid('unselectrow', event.args.rowindex);
	}
});*/

    $('#jqxgrid').jqxGrid({
        altrows: false
    });

    // Change text of loading message form "Loading..." to "Requesting Data.."
    $('#jqxgrid').find('div.jqx-grid-load').next().text('Requesting Data...').css({
        'font-family': 'Calibri',
        'font-size': '14px',
        'color': '#333'
    }).parent().parent().width(153);


    $("#jqxgrid").on("columnresized", function (event) {
        var args = event.args,
            newCols = $("#jqxgrid").jqxGrid("columns");

        for (var i = 0; i < newCols.records.length; i++) {
            if (args.datafield != newCols.records[i].datafield) {
                newCols.records[i].width = cols.records[i].width;
                $("#jqxgrid").jqxGrid('setcolumnproperty', newCols.records[i].datafield, 'width', cols.records[i].width);
            }
        }
    });

    var contextMenu = $("#jqxgridMenu").jqxMenu({
        width: 175,
        height: 92,
        autoOpenPopup: false,
        mode: 'popup'
    });
    $("#jqxgrid").on('contextmenu', function () {
        return false;
    });
    $("#jqxgridMenu").on('itemclick', function (event) {
        var args = event.args;
        var rowindex = $("#jqxgrid").jqxGrid('getselectedrowindex');
        switch ($.trim($(args).text())) {
            case "Select All":
                $("#jqxgrid").jqxGrid('selectallrows');
                break;

            case "Copy":
                copySelectedSeriesToClipboard();
                break;

            case "Highlight weekends":
                highlight_weekends = !highlight_weekends;
                $(".highlight-weekends").toggle(highlight_weekends);
                $("#jqxgrid").jqxGrid('updatebounddata', 'cells');
                break;
        }
    });

    $("#jqxgrid").on('rowclick', function (event) {
        if (event.args.rightclick) {
            $("#jqxgrid").jqxGrid('selectrow', event.args.rowindex);
            var scrollTop = $(window).scrollTop();
            var scrollLeft = $(window).scrollLeft();
            contextMenu.jqxMenu('open', parseInt(event.args.originalEvent.clientX) + 5 + scrollLeft, parseInt(event.args.originalEvent.clientY) + 5 + scrollTop);
            return false;
        }
    });

    if (parseInt(corrections_count) > 0) {
        $("#jqxgrid").on("rowclick", function (event) {
            if (event.args.row.bounddata.corrected == true)
                showCorrectionDetails(event.args.row.bounddata);
        });

        $("#jqxgrid").on("rowdoubleclick", function (event) {
            if (event.args.row.bounddata.corrected == true) {
                $('#bottomSplitter').jqxSplitter('expand');
                showCorrectionDetails(event.args.row.bounddata);
            }
        });
    }

    function copySelectedSeriesToClipboard() {
        var rowsindexes = $("#jqxgrid").jqxGrid('getselectedrowindexes');
        var rows = [];
        for (var i = 0; i < rowsindexes.length; i++) {
            rows[rows.length] = $("#jqxgrid").jqxGrid('getrowdata', rowsindexes[i]);
        }

        var Results = getRowsData();

        Results.splice(1, 4);
        Results.splice(0, 1, ["Name:", gridMetadata.Name + ' (' + full_symbol + ')']);

        var CsvString = "";
        Results.forEach(function (RowItem, RowIndex) {
            RowItem.forEach(function (ColItem, ColIndex) {
                CsvString += ColItem + "\t";
            });
            CsvString += "\r\n";
        });

        copyToClipboard(CsvString);

        var singleCase = rows.length == 1 ? "has" : "have";
        var singleRow = rows.length == 1 ? "row" : "rows";
        functionNotificationMessage({
            text: rows.length + ' ' + singleRow + ' ' + singleCase + " been copied to the clipboard",
            type: "info"
        });
    }

    function showCorrectionDetails() {
        $("#jqxgridCorrectionDetails").jqxGrid('updatebounddata', 'cells');
        $("#jqxgridCorrectionDetails").jqxGrid('autoresizecolumns', 'cells');
    }

    var sourceCorrections = {
            datafields: [{
                    name: 'PriceDay',
                    type: 'date'
                },
                {
                    name: 'CorrectionDateTime',
                    type: 'date'
                },
                {
                    name: 'IssuedDate',
                    type: 'date'
                },
                {
                    name: 'Bate',
                    type: 'string'
                },
                {
                    name: 'Type',
                    type: 'string'
                },
                {
                    name: 'OriginalPrice',
                    type: 'string'
                },
                {
                    name: 'CorrectedPrice',
                    type: 'string'
                },
                {
                    name: 'AddedToDB',
                    type: 'date'
                }
            ],
            localdata: corrections_array
        },

        dataAdapterCorrections = new $.jqx.dataAdapter(sourceCorrections, {
            async: true,
            autoBind: false
        });

    $("#jqxgridCorrectionDetails").jqxGrid({
        width: '100%',
        source: dataAdapterCorrections,
        columnsresize: true,
        sortable: true,
        filterable: true,
        showtoolbar: true,
        toolbarheight: 25,
        ready: function () {
            var rows = $('#jqxgrid').jqxGrid('getrows');
            var rowData = $('#jqxgridCorrectionDetails').jqxGrid('getrows');
            var rowsCount = rows.length;
            data_corr = {};

            for (var i = 0; i < rowsCount; i++) {
                var value = $('#jqxgrid').jqxGrid('getcellvalue', i, "Date");

                for (var n = 0; n < rowData.length; n++) {
                    if (getDate(value) == getDate(rowData[n].PriceDay)) {
                        if (data_corr[getDate(rowData[n].PriceDay)] !== undefined && !data_corr[getDate(rowData[n].PriceDay)].column.includes(rowData[n].Bate)) {
                            data_corr[getDate(rowData[n].PriceDay)].column.push(rowData[n].Bate);
                        } else {
                            data_corr[getDate(rowData[n].PriceDay)] = {
                                date: rowData[n].PriceDay,
                                column: ["Date", rowData[n].Bate]
                            };
                        }
                    }
                }
            }
            $('#jqxgrid').jqxGrid('updatebounddata', 'cells');
            resizeColumns('jqxgridCorrectionDetails');
        },
        rendertoolbar: function (toolbar) {

            var container = $("<div id='correct-container'></div>");

            toolbar.append(container);

            container.append(
                '<table class="toolbar-table"><tr>' +
                '<td><div id="correct-title">Series Corrections</div></td>' +
                '<td id="btn-correct-close"><input id="btnCloseCorrestinDetails" type="button"/>' +
                '<input id="btnAutosizeCorrectionDetails" type="button"/></td>' +
                '</tr></table>'
            );

            $("#btnAutosizeCorrectionDetails").jqxButton({
                imgSrc: "resources/css/icons/autosize.png",
                imgPosition: "center",
                width: '30'
            });
            $("#btnCloseCorrestinDetails").jqxButton({
                imgSrc: "resources/css/icons/clear.png",
                imgPosition: "center",
                width: 24,
                height: 24
            });

            $("#btnCloseCorrestinDetails").on('click', function () {
                $('#bottomSplitter').jqxSplitter('collapse');
            });

            $("#btnAutosizeCorrectionDetails").on('click', function () {
                resizeColumns('jqxgridCorrectionDetails');
            });
        },
        columns: [{
                text: 'Date',
                datafield: 'PriceDay',
                cellsalign: 'center',
                align: 'center',
                filtertype: 'range',
                cellsformat: 'yyyy-MM-dd'
            },
            {
                text: 'Type',
                datafield: 'Type',
                align: 'center',
                cellsalign: 'center'
            },
            {
                text: 'Bate',
                datafield: 'Bate',
                align: 'center',
                cellsalign: 'center'
            },
            {
                text: 'Original Value',
                datafield: 'OriginalPrice',
                cellsalign: 'right',
                align: 'center',
                cellsrenderer: cellsrendererRows
            },
            {
                text: 'Corrected Value',
                datafield: 'CorrectedPrice',
                align: 'center',
                cellsalign: 'right',
                cellsrenderer: cellsrendererRows
            },
            {
                text: 'Date Issued',
                datafield: 'IssuedDate',
                align: 'center',
                cellsalign: 'center',
                cellsformat: 'yyyy-MM-dd hh:mm'
            },
            {
                text: 'Date Added',
                datafield: 'AddedToDB',
                align: 'center',
                cellsalign: 'center',
                cellsformat: 'yyyy-MM-dd hh:mm'
            }
        ]
    });

    $("#jqxgridCorrectionDetails").on('rowclick', function (event) {
        var rowData = $("#jqxgridCorrectionDetails").jqxGrid("getrowdata", event.args.rowindex);
        var rows = $('#jqxgrid').jqxGrid('getrows');
        var rowsCount = rows.length;
        for (var i = 0; i < rowsCount; i++) {
            var value = $('#jqxgrid').jqxGrid('getcellvalue', i, "Date");
            if (getDate(value) == getDate(rowData.PriceDay)) {
                $('#jqxgrid').jqxGrid('clearselection');
                $('#jqxgrid').jqxGrid('selectrow', i);
                $('#jqxgrid').jqxGrid('scrolloffset', 28 * i, 0);
                break;
            }
        }
    });

    function resizeElements() {
        var contentBottomPadding = parseInt($(".main-content").css("padding-bottom"));
        $('#mainSplitter').css('min-height', (window.innerHeight - $(".navbar").height() - contentBottomPadding + 16) + 'px');
      //$(".jqx-tabs-content-element").css("height", (window.innerHeight - $(".navbar").height() - contentBottomPadding - 69) + "px");
    }

    $(window).resize(function () {
        resizeElements()
    });
    resizeElements();

    $('#exportDialogWindow').jqxWindow({
        showCollapseButton: false,
        resizable: false,
        height: 240,
        width: 400,
        autoOpen: false,
        title: 'Export Database Metadata',
        initContent: function () {
            $('#exportSeriesBtn').jqxButton({
                width: '75px',
                height: '30px'
            });
            $("#exportSeriesBtn").on('click', function () {
                exportData();
                $('#exportDialogWindow').jqxWindow('close');
            });

            $('#cancelExportDialog').jqxButton({
                width: '75px',
                height: '30px'
            });
            $("#cancelExportDialog").on('click', function () {
                $('#exportDialogWindow').jqxWindow('close');
            });
        }
    });

    function makeExportSeriesDialog() {
        var rows = $('#jqxgrid').jqxGrid('getrows');
        $('#exportDialogWindow #num').text(rows.length);
        if ($('#jqxgrid').jqxGrid('selectedrowindexes').length == 0) {
            $("#export-one").prop('disabled', true);
            $("#export-all").prop('checked', true);
        } else {
            $("#export-all, #export-one").prop('disabled', false);
            $("#export-one").prop('checked', true);
        }
        let record = ($('#jqxgrid').jqxGrid('selectedrowindexes').length > 1) ? "records" : "record";
        let msg = "Export the " + $('#jqxgrid').jqxGrid('selectedrowindexes').length + " selected " + record;
        $('#exportSelectedRecordsText').text(msg);
        $('#exportDialogWindow').jqxWindow('open');
    }

    function getRowsData() {
        var frequencyDropdown = $("#series_frequency").jqxDropDownList('getSelectedItem'),
            frequency = frequencyDropdown != null ? frequencyDropdown.value : 'Default',
            export_type = $('input[name="export_type"]:checked').val(),
            rows,
            datasets = [];

        if (export_type == "selected") {
            var indexes = $('#jqxgrid').jqxGrid('getselectedrowindexes')

            if (indexes.length == 0) {
                dialogWindow("Please select at least one date", "error");
                return;
            } else {
                indexes.forEach(function (item, i, indexes) {
                    rows = $('#jqxgrid').jqxGrid('getrowdata', item);
                    let data = columns.map(function (v) {
                        if (v.datafield == "Date") {
                            var date = rows[v.datafield],
                                day = date.getDate(),
                                month = date.getMonth() + 1,
                                year = date.getFullYear();
                            day = (day < 10) ? '0' + day : day;
                            month = (month < 10) ? '0' + month : month;
                            return year + '-' + month + '-' + day;
                        }
                        return (rows[v.datafield] == undefined) ? "" : rows[v.datafield];
                    });
                    datasets.push(data.slice(1));
                });
            }
        } else if (export_type == "all") {
            var items = $('#jqxgrid').jqxGrid('getrows');

            items.forEach(function (rows) {
                let data = columns.map(function (v) {
                    if (v.datafield == "Date") {
                        var date = rows[v.datafield],
                            day = date.getDate(),
                            month = date.getMonth() + 1,
                            year = date.getFullYear();
                        day = (day < 10) ? '0' + day : day;
                        month = (month < 10) ? '0' + month : month;
                        return year + '-' + month + '-' + day;
                    }
                    return (rows[v.datafield] == undefined) ? "" : rows[v.datafield];
                });
                datasets.push(data.slice(1));
            });
        }

        Results = [
            ["Name:", "Xlerate for Excel. Exported by " + userName],
            ["Series:", full_symbol],
            ["Average:", frequency],
            ["From:", gridMetadata.StartDate],
            ["To:", gridMetadata.EndDate],
        ];

        Results.push(columns.map(v => v.text).slice(1));
        datasets.map(v => Results.push(v));

        return Results;
    }

    // Export data to csv file
    function exportData() {

        var date = new Date(),
            day = date.getDate(),
            month = date.getMonth() + 1,
            year = date.getFullYear();

        day = (day < 10) ? '0' + day : day;
        month = (month < 10) ? '0' + month : month;
        date = day + '-' + month + '-' + year;

        var Results = getRowsData();

        var CsvString = "";
        Results.forEach(function (RowItem, RowIndex) {
            RowItem.forEach(function (ColItem, ColIndex) {
                if (ColItem == "") ColItem = " ";
                CsvString += '"' + ColItem + '",';
            });
            CsvString += "\r\n";
        });

        CsvString = "data:application/csv," + encodeURIComponent(CsvString);
        var link = document.createElement("a");
        link.href = CsvString;
        link.download = datasource + "-" + symbol + "-EXPORT-" + date + ".csv";
        link.click();
    }


    function loadCorrections(async, gridMetadata, corrections_array) {
        if (corrections_count == 0) return;

        var source = {
            datafields: [{
                    name: 'PriceDay',
                    type: 'date'
                },
                {
                    name: 'CorrectionDateTime',
                    type: 'date'
                },
                {
                    name: 'IssuedDate',
                    type: 'date'
                },
                {
                    name: 'Bate',
                    type: 'string'
                },
                {
                    name: 'Type',
                    type: 'string'
                },
                {
                    name: 'OriginalPrice',
                    type: 'string'
                },
                {
                    name: 'CorrectedPrice',
                    type: 'string'
                },
                {
                    name: 'AddedToDB',
                    type: 'date'
                }
            ],
            localdata: corrections_array
        };
        correctionsDataAdapter = new $.jqx.dataAdapter(source, {
            async: true,
            autoBind: false
        });

        $("#jqxgridCorrections").jqxGrid({
            width: '100%',
            height: '100%',
            source: correctionsDataAdapter,
            columnsresize: true,
            sortable: true,
            filterable: true,
            ready: function () {
                correctionsTab = true;
                $("#jqxgridCorrections").jqxGrid('updatebounddata', 'cells');
                resizeColumns('jqxgridCorrections');

            },
            columns: [{
                    text: 'Date',
                    datafield: 'PriceDay',
                    cellsalign: 'center',
                    align: 'center',
                    filtertype: 'range',
                    cellsformat: 'yyyy-MM-dd'
                },
                {
                    text: 'Type',
                    datafield: 'Type',
                    align: 'center',
                    cellsalign: 'center'
                },
                {
                    text: 'Bate',
                    datafield: 'Bate',
                    align: 'center',
                    cellsalign: 'center'
                },
                {
                    text: 'Original Value',
                    datafield: 'OriginalPrice',
                    cellsalign: 'right',
                    align: 'center',
                    cellsrenderer: cellsrendererRows
                },
                {
                    text: 'Corrected Value',
                    datafield: 'CorrectedPrice',
                    align: 'center',
                    cellsalign: 'right',
                    cellsrenderer: cellsrendererRows
                },
                {
                    text: 'Date Issued',
                    datafield: 'IssuedDate',
                    align: 'center',
                    cellsalign: 'center',
                    cellsformat: 'yyyy-MM-dd hh:mm'
                },
                {
                    text: 'Date Added',
                    datafield: 'AddedToDB',
                    align: 'center',
                    cellsalign: 'center',
                    cellsformat: 'yyyy-MM-dd hh:mm'
                }
            ]
        });
    }

    var meta_rows = $("#metadataContent").find("div"),
        size = 1.35 * (meta_rows[0].offsetHeight + meta_rows[1].offsetHeight);
  
    $('#mainSplitter').jqxSplitter({
        height: '100%',
        width: '100%',
        orientation: 'horizontal',
        panels: [{
            size: size + "px"
        }, {
            size: "50%"
        }]
    });
    $('#bottomSplitter').jqxSplitter({
        height: '100%',
        width: '100%',
        orientation: 'horizontal',
        panels: [{
            size: "70%",
            collapsible: false
        }, {
            size: "30%",
            collapsed: true
        }]
    });
    $('#pricesSplitter').jqxSplitter({
        height: '100%',
        width: '100%',
        orientation: 'vertical',
        panels: [{
            size: "50%",
            collapsible: false
        }, {
            size: "50%",
            collapsible: true
        }]
    });

    $('#bottomSplitter').on('resize', function (e) {
        $("#jqxgridCorrectionDetails").jqxGrid({
            height: $('#jqxgridCorrectionDetails').parent().height()
        });
        if (linessubchart !== undefined && $('#subchart').width() > 10) {
            window.dispatchEvent(new Event('resize'));
        }
    });

    $('#pricesSplitter').on('resize', function (e) {
      setTimeout(() => {
        $('.left-toolbar-button').css('display', 'block');
        $('.right-toolbar-content').css('justify-content', 'flex-end').css('margin-left', 'auto');
      }, 50);
         //if ($("#seriesToolbar").length > 0) setTimeout(() => {
         //    $("#seriesToolbar").jqxToolBar('refresh')
         //}, 100);
        if (linessubchart !== undefined && $('#subchart').width() > 10) {
            window.dispatchEvent(new Event('resize'));
        }

    });

    $('#pricesSplitter').on('expanded', function (e) {
        if (!isSubChartLoaded) {
            isSubChartLoaded = true;
            createSubChart(rowsData);
        }
    });

    $('#mainSplitter').on('resize expanded collapsed', function (e) {
        $(".jqx-tabs-content-element").each(function () {
            $(this).css({
                height: $('#bottomPanel').css('height').slice(0,-2) - 35 + "px"
            });
        });
      
        if (linessubchart !== undefined && $('#subchart').width() > 10) {
            if ($("#bottom-subchart").css("display") !== "none") {
                $("#top-subchart").css({
                    height: "calc( 70% - 48px )"
                });
                $("#bottom-subchart").css({
                    height: "calc( 30% - 48px )"
                });
            } else {
                $("#top-subchart").css({
                    height: "calc( 100% - 96px )"
                });
            }
        }
        if (lineschart !== undefined && $("#chart").width() > 10) {
            if ($("#bottom-subchart").css("display") !== "none") {
                $("#top-chart").css({
                    height: "calc( 70% - 48px )"
                });
                $("#bottom-chart").css({
                    height: "calc( 30% - 48px )"
                });
            } else {
                $("#top-subchart").css({
                    height: "calc( 100% - 96px )"
                });
            }
        }
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 10);
    });

    if (layout == 2) {
        // if ( !isSubChartLoaded )
        // {
        // 	isSubChartLoaded = true;
        // 	createSubChart( rowsData );
        //
        // }

        $('#bottomSplitter').jqxSplitter('collapse');
        // as data of chart is large therefore timeout is set to not messed up charts on resize
        //         setTimeout(function () {
        $('#pricesSplitter').jqxSplitter('expand');
        // }, 5000);

    } else if (layout == 3) {
        if (!isSubChartLoaded) {
            isSubChartLoaded = true;
            createSubChart(rowsData);
        }
        $('#bottomSplitter').jqxSplitter('expand');
        $('#pricesSplitter').jqxSplitter('expand');
    } else {
        $('#bottomSplitter').jqxSplitter('collapse');
        $('#pricesSplitter').jqxSplitter('expand');
    }



    if (requestedTab != null && requestedTab != '') {
        if (requestedTab == 'chart') {
            // as data of chart is large therefore timeout is set to not messed up charts on resize
            // setTimeout(function () {
            $('#jqxTabs').jqxTabs('select', 1);
            if (!isChartLoaded) {
                isChartLoaded = true;
                createChart(rowsData);
            }
            // }, 5000);
        } else if (requestedTab == 'corrections' && corrections_count > 0) {
            setTimeout(function () {
                $('#jqxTabs').jqxTabs('select', 2);
                if (!isCorrectionsLoaded) {
                    isCorrectionsLoaded = true;
                    loadCorrections(true, gridMetadata, corrections_array);
                }
            }, 2000);
        } else window.history.pushState("datasetsPage", datasource + " database", "/seriesviewer?symbol=" + full_symbol + "&tab=prices" + layoutURL);
    } else window.history.pushState("datasetsPage", datasource + " database", "/seriesviewer?symbol=" + full_symbol + "&tab=prices" + layoutURL);


    if (corrections_count == 0) {
        $('#jqxTabs').jqxTabs('removeAt', 2);
    }

    $('#triangle').click(function () {
        meta_rows = $("#metadataContent").find("div"),
            size = 1.35 * (meta_rows[0].offsetHeight + meta_rows[1].offsetHeight),
            number = $("#metadataContent")[0].offsetHeight;
      
        if (toggleMetaData === 1) {
            this.src = "resources/images/up.png";
            $('#mainSplitter').jqxSplitter({
                panels: [{
                    size: number * 1.1 + "px"
                }]
            });
          
          $(".jqx-tabs-content-element").each(function () {
            $(this).css({
              height: $('#mainSplitter').css('height').slice(0,-2) - 163 + "px"
            });
          });

          if (linessubchart !== undefined && $('#subchart').width() > 10) {
            if ($("#bottom-subchart").css("display") !== "none") {
              $("#top-subchart").css({
                height: "calc( 70% - 48px )"
              });
              $("#bottom-subchart").css({
                height: "calc( 30% - 48px )"
              });
            } else {
              $("#top-subchart").css({
                height: $('#mainSplitter').css('height').slice(0,-2) - 268 + "px"
              });
            }
          }
          if (lineschart !== undefined && $("#chart").width() > 10) {
            if ($("#bottom-subchart").css("display") !== "none") {
              $("#top-chart").css({
                height: "calc( 70% - 48px )"
              });
              $("#bottom-chart").css({
                height: "calc( 30% - 48px )"
              });
            } else {
              $("#top-subchart").css({
                height: "calc( 100% - 96px )"
              });
            }
          }
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
          }, 10);
          
        } else if (toggleMetaData === -1) {
            this.src = "resources/images/down.png";
            $('#mainSplitter').jqxSplitter({
                panels: [{
                    size: size + "px"
                }]
            });
          
          $(".jqx-tabs-content-element").each(function () {
            $(this).css({
                height: $('#mainSplitter').css('height').slice(0,-2) - 83 + "px"
            });
        });
      
        if (linessubchart !== undefined && $('#subchart').width() > 10) {
            if ($("#bottom-subchart").css("display") !== "none") {
                $("#top-subchart").css({
                    height: "calc( 70% - 48px )"
                });
                $("#bottom-subchart").css({
                    height: "calc( 30% - 48px )"
                });
            } else {
                $("#top-subchart").css({
                    height: $('#mainSplitter').css('height').slice(0,-2) - 188 + "px"
                });
            }
        }
        if (lineschart !== undefined && $("#chart").width() > 10) {
            if ($("#bottom-subchart").css("display") !== "none") {
                $("#top-chart").css({
                    height: "calc( 70% - 48px )"
                });
                $("#bottom-chart").css({
                    height: "calc( 30% - 48px )"
                });
            } else {
                $("#top-subchart").css({
                    height: "calc( 100% - 96px )"
                });
            }
        }
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 10);
        }
        toggleMetaData *= -1;
        window.dispatchEvent(new Event('resize'));
    });

    $('body').removeClass('hiddenBody');
    let x = $("#right-toolbar-content").children('.jqx-widget');
    x.addClass('d-none');
}