/*******************
 Series Report
 *******************/
let parameters, requestParameters, notesParameters, userParameters, hideEmptyRows = false, allow_weekend = false, edit_flag = false, report_name, report_locked, report_type, request_editor, notes_editor, user_editor, response_viewer, response_json, columns;

window.onload = function () {

    setTimeout(hideloader, 2500); /* change the value "2000ms to any duration you want */

    //hide the preloader
    function hideloader() {
        document.querySelector(".loader-container").style.display = "none";        
    }

    $.jqx.theme = 'light';
    $.jqx.utilities.scrollBarSize = 11;

    // Define all variables
    var toggleMetaData = 1,
        requestedTab = getParameterByName('tab'),
        report_id = getParameterByName('report_id'),
        // series = ["SCFNBY/CBOE_VX2_EB", "ECBFX/EURCAD"],
        sessionToken = getSession(),
        layout = getParameterByName('layout'),
        isPricesDataLoaded = false,
        chartSource,
        highlight_weekends = true,
        hasUserAccessToCategory = true,
        layoutURL = !isNaN(parseInt(layout)) ? "&layout=" + layout : "",
        frequency_array = {
            d: 'Day',
            w: 'Week',
            hm: 'HalfMonth',
            m: 'Month',
            q: 'Quarter',
            hy: 'HalfYear',
            y: 'Year'    
        },
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
        gridMetadata,
        startDate,
        endDate,
        data_corr = {},
        corrections_count = 0,
        hide_data,
        bateStatus = [],

        isSubChartLoaded = false,
        rowsData,
        rowsOriginalData,
        rowsWeekendData,
        preHeaderColumnHeight = 0,
        reportsList = [],
        selectReportIndex = -1;

    // window.addEventListener('click', function(){
    //     var isOpen = $('#loginForm').jqxWindow('isOpen');
    //     if(isOpen == false){
    //         sessionToken = checkHandleSessionToken(getSession());
    //     }
    // });
    
    request_editor = new JsonEditor('#request-json-display', {}, {editable: false});
    notes_editor = new JsonEditor('#notes-json-display', {}, {editable: false});    
    user_editor = new JsonEditor('#user-json-display', {}, {editable: false});
    response_viewer = new JSONViewer();
    document.querySelector("#response-json-display").appendChild(response_viewer.getContainer());
    
    function isNumberFunc(n) {
        return /^-?[\d.]+(?:e-?\d+)?$/.test(n) && !isNaN(parseFloat(n));
    }

    $("#jqxLoader").jqxLoader({
        width: 120,
        height: 60,
        autoOpen: false,
        imagePosition: 'top',
        text: "Requesting data..."
    });

    var textLength = $("<span class='hidden-text'>");
    $('body').append(textLength);

    function resizeColumns(grid_id) {
        var grid = grid_id,
            get_columns = grid.getColumns(),
            gridData = {};
        
        if(grid.getData().length == undefined)
            var rows = grid.getData().getItems();
        else
            var rows = grid.getData();

        if (
            get_columns !== undefined && Array.isArray(get_columns) && get_columns.length > 0 &&
            rows !== undefined && Array.isArray(rows) && rows.length > 0
        ) {
            get_columns.map(column => {
                rows.map(row => {
                    if (column.field !== undefined && Object.keys(row).includes(column.field)) {
                        if (!Object.keys(gridData).includes(column.field))
                            gridData[column.field] = [];

                        if (
                            row[column.field] == "NA" ||
                            row[column.field] == "N/A" ||
                            row[column.field] == undefined ||
                            row[column.field] == null ||
                            row[column.field] == '<span id="NoValue">N/A<span>'
                        ) {
                            gridData[column.field].push("0");
                        } else if (
                            column.cellsformat !== undefined && (
                                column.cellsformat.toLowerCase() == "yyyy-mm-dd" ||
                                column.cellsformat.toLowerCase() == "yyyy-mm-dd hh:mm" ||
                                column.cellsformat.toLowerCase() == "yyyy-mm-dd hh:mm:ss")
                        ) {
                            var date = new Date(row[column.field]),
                                dd = date.getDate(),
                                MM = date.getMonth() + 1,
                                yy = date.getFullYear(),
                                hh = date.getHours(),
                                mm = date.getMinutes(),
                                ss = date.getSeconds();

                            if (dd < 10) dd = '0' + dd;
                            if (mm < 10) mm = '0' + mm;
                            
                            if (column.cellsformat.toLowerCase() == "yyyy-mm-dd hh:mm:ss")
                                gridData[column.field].push(yy + "-" + MM + "-" + dd + " " + hh + ":" + mm + ":" + ss);

                            else if (column.cellsformat.toLowerCase() == "yyyy-mm-dd hh:mm")
                                gridData[column.field].push(yy + "-" + MM + "-" + dd + " " + hh + ":" + mm);

                            else
                                gridData[column.field].push(yy + "-" + MM + "-" + dd);
                        } else
                            gridData[column.field].push(row[column.field])
                    }
                });
            });

            for (var k in gridData) {

                gridData[k] = gridData[k].reduce(function (a, b) {
                    return String(a).length > String(b).length ? a : b;
                });

                if (k.toLowerCase() !== "#" && k.toLowerCase() !== "date" && k.toLowerCase() !== "volume" && isNumberFunc(gridData[k]))
                    gridData[k] = parseFloat(gridData[k]).toFixed(real_decimal);

                textLength.text(gridData[k]);
                let valueWidth = textLength.width();
                get_columns = get_columns.map(v => {
                    if (v !== undefined && v.field == k) {
                        textLength.text(v.text);
                        v.width = textLength.width() > valueWidth ? textLength.width() : valueWidth;
                        v.width += 20;
                    }
                    return v;
                });
            }

            setTimeout(() => {
                for (var i = 0; i < columns.length; i++) {                    
                    if(parseInt($('#slick-column-name-'+i).width()) > parseInt($('#slick-column-name-'+i).parent().width())){
                        get_columns[i].minWidth = parseInt($('#slick-column-name-'+i).width())+8;
                    }
                }

                grid.setColumns(get_columns);
                CreateAddPreHeaderRow();
            }, 10);
            
            setTimeout(() => {
                resizeElements();
            }, 50);
        }
    }

    $('#topPanel, #jqxTabs').show();
    $('#jqxTabs').jqxTabs({
        width: '100%',
        height: '100%',
        position: 'top',
        keyboardNavigation: false
    });

    $("#jqxTabsTab2").css("float", "right").css("margin-right", "20px");
    $("#jqxTabsTab3").css("float", "right");

    // $('#profile').attr('href', 'profile?tab=MyProfile');
    // $('#favorites').attr('href', 'profilemain?tab=favorites');
    // $('#logout').click(function () {
    //     logout();
    // });

    $("#jqxExpander1").jqxExpander({ width: '100%', expanded: true});
    $("#jqxExpander2").jqxExpander({ width: '100%', expanded: false});
    $("#jqxExpander3").jqxExpander({ width: '100%', expanded: false});

    $('#jqxExpander1').on('expanded', function () {
        $("#jqxExpander2").jqxExpander({ width: '100%', expanded: false});
        $("#jqxExpander3").jqxExpander({ width: '100%', expanded: false});

        $('#request-json-display').parent().css('height', parseInt($('#jqxTabs').height())-195);
        $('#notes-json-display').parent().css('height', parseInt($('#jqxTabs').height())-195);
        $('#user-json-display').parent().css('height', parseInt($('#jqxTabs').height())-195);
    });

    $('#jqxExpander2').on('expanded', function () {
        $("#jqxExpander1").jqxExpander({ width: '100%', expanded: false});
        $("#jqxExpander3").jqxExpander({ width: '100%', expanded: false});
        
        $('#request-json-display').parent().css('height', parseInt($('#jqxTabs').height())-195);
        $('#notes-json-display').parent().css('height', parseInt($('#jqxTabs').height())-195);
        $('#user-json-display').parent().css('height', parseInt($('#jqxTabs').height())-195);
    });

    $('#jqxExpander3').on('expanded', function () {
        $("#jqxExpander1").jqxExpander({ width: '100%', expanded: false});
        $("#jqxExpander2").jqxExpander({ width: '100%', expanded: false});

        $('#request-json-display').parent().css('height', parseInt($('#jqxTabs').height())-195);
        $('#notes-json-display').parent().css('height', parseInt($('#jqxTabs').height())-195);
        $('#user-json-display').parent().css('height', parseInt($('#jqxTabs').height())-195);
    }); 

    // Function to register the data
    function enterDate(data, freq = 'd') {
        if (data) {
            $('#water').remove();

            if (data.Metadata && data.Metadata[0].Simulated !== undefined)
                disabledGrid = data.Metadata[0].Simulated;

            corrections_array = data.Corrections[data.Parameters.Series[0].Datasource+'/'+data.Parameters.Series[0].Symbol];
            //            alert(JSON.stringify(data.BateStatus));

            bateStatus = data.Columns;

            let corrections_new_array = [];

            for (var i in corrections_array) {
                for (var x in corrections_array[i]) {
                    corrections_new_array.push({
                        PriceDay: i,
                        Type: corrections_array[i][x][0]['Operation'],
                        Bate: x,
                        OriginalPrice: (corrections_array[i][x][0]['From'] == undefined) ? "" : corrections_array[i][x][0]['From'],
                        IssuedDate: (corrections_array[i][x][0]['PublishedDateTime'] == undefined) ? "" : corrections_array[i][x][0]['PublishedDateTime'],
                        CorrectedPrice: (corrections_array[i][x][0]['To'] == undefined) ? "" : corrections_array[i][x][0]['To'],
                        AddedToDB: (corrections_array[i][x][0]['InsertDateTime'] == undefined) ? "" : corrections_array[i][x][0]['InsertDateTime']
                    });
                }
            }

            corrections_array = corrections_new_array;
            corrections_array.reverse();

            // gridMetadata = data.Metadata[0];
            startDate = Object.keys(data.Rows)[0];
            endDate = Object.keys(data.Rows)[Object.keys(data.Rows).length - 1];

            if (data.Columns.length > 0) {
                bates = bateStatus.map(function (v, n) {
                    var json = {
                        id: v.Bate+"-"+n,
                        name: v.Bate,
                        description: v.Name,
                        datasource: v.Datasource,
                        symbol: v.Symbol,
                        datasource: v.Datasource,
                        type: 'float'
                    };
                    if(v.Datacategory != undefined){
                        json.category = v.Datacategory;
                    }

                    return json;
                });

                corrections_count = data.Corrections.length;
            }

            rowsOriginalData = [];
            rowsData = Object.keys(data.Rows).map(function (date) {
                let row = {
                    Date: date
                };
                for (var i in bates) {
                    let num = data.Rows[date][i],
                        value = !isNumberFunc(num) ? num : data.Rows[date][i].toFixed(bates[i].name.toLowerCase() == "volume" ? 0 : 4);
                    value = (value == 'NA') ? '<span id="NoValue">N/A<span>' : value;
                    row[bates[i].id] = value;
                }
                rowsOriginalData.push(row);
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
            }
            if (chartSource !== undefined) chartSource.localdata = rowsData;

            for (var i = 0; i < source.localdata.length; i++) {
                source.localdata[i].id = "id1_" + i;
                source.localdata[i].num = (i + 1);

                if(source.localdata[i].Close == null){
                    source.localdata[i].Close = "";
                }
    
                if(source.localdata[i].High == null){
                    source.localdata[i].High = "";
                }
    
                if(source.localdata[i].Low == null){
                    source.localdata[i].Low = "";
                }
    
                if(source.localdata[i]['Mean (c)'] == null){
                    source.localdata[i]['Mean (c)'] = "";
                }
    
                if(source.localdata[i]['Hi-Lo (c)'] == null){
                    source.localdata[i]['Hi-Lo (c)'] = "";
                }
            }

            if(grid != undefined){
                grid.setData(source.localdata);
                dataView.beginUpdate();
                dataView.setItems(source.localdata, "id");
                dataView.endUpdate();
                dataView.reSort();
                grid.invalidate();
                grid.render();
                
                setTimeout(() => {
                    var iScrollHeight = $(".slick-viewport").prop("scrollTop");
                    if(iScrollHeight > 0)
                        $(".slick-viewport").prop("scrollTop", 0);
                    else
                        $(".slick-viewport").prop("scrollTop", iScrollHeight+30);
                }, 500);
            }
        }
    }
    
    function ShowJSReport(reportJson){

        reportJson.SessionToken = getSession();

        // console.log(reportJson);
        
        call_api_ajax('GetDatasetValuesRC', 'POST', JSON.stringify(reportJson), false, (data, textStatus, XmlHttpRequest) => {

            if (data.Result.length == 0 || data.Result.Rows == undefined) {
                let type = 'Metadata or BateStatus';
                if (data.Result.Metadata == undefined) type = 'Metadata';
                else if (data.Result.Columns == undefined) type = 'BateStatus';
                else if (data.Result.Rows == undefined) type = 'Values';
    
                dialogWindow('The server responded with "' + XmlHttpRequest.status + '" but cannot read the ' + type + ' field', 'error');
                console.warn(data);
                return;
            } else if (data.Result.Columns !== undefined && data.Result.Columns.Status > 299) {
                dialogWindow('Server returned: ' + data.Result.Columns.Status + '. No access to the data series requested', 'error');
                console.warn(data);
                return;
            } else {
                enterDate(data.Result, reportJson.Frequency); // Register the data
                delete reportJson["SessionToken"]
                request_editor.load(reportJson);                
                // $('#response-json-display').jsonViewer(data.Result, {collapsed: true});
                response_viewer.showJSON(data.Result, null, 1);
                response_json = data.Result;

                setTimeout(() => {
                    $("#series_frequency").jqxDropDownList('selectItem', frequency_array[reportJson.Frequency]);
                    $("#series_frequency_json").jqxDropDownList('selectItem', frequency_array[reportJson.Frequency]);
                    resizeElements();
                }, 10);
            }
        });    
    }

    function updateReportListCombobox(){
        reportsList = [];
        call_api_ajax1('ListReports', 'get', {
            SessionToken: getSession()
        }, false, (data) => {
            for (var i = 0; i < data.Result.length; i++) {
                reportsList.push({
                    ReportID: data.Result[i].ReportID,
                    Name: data.Result[i].Name,
                    Type: data.Result[i].Type,
                    Notes: data.Result[i].Notes,
                    ReportJSON: data.Result[i].ReportJSON,
                    UserJSON: data.Result[i].UserJSON,
                    Locked: data.Result[i].Locked
                });
                if(report_name == data.Result[i].Name)
                    selectReportIndex = i;
            }
        });

        $("#reportsList").jqxComboBox("source", reportsList);
        $("#reportsList").jqxComboBox("selectedIndex", selectReportIndex);
    }

    let Series=[];

    call_api_ajax1('ReadReport', 'get', {
        SessionToken: getSession(),
        ReportID: report_id
    }, false, (data) => {
        parameters = JSON.parse(data.Result.ReportJSON);
        report_id = data.Result.ReportID;
        report_name = data.Result.Name;
        report_locked = data.Result.Locked;
        report_type = data.Result.Type;
        ShowJSReport(parameters);
        
        notes_editor.load(data.Result.Notes);
        user_editor.load(JSON.parse(data.Result.UserJSON));

        requestParameters = JSON.parse(data.Result.ReportJSON);
        requestParameters.FrequencyOptions = {
            AllowWeekends: 'off'
        };
        notesParameters = data.Result.Notes;
        userParameters = JSON.parse(data.Result.UserJSON);

        $('#reportID').text(data.Result.ReportID);
        $('#saveReportID').text(data.Result.ReportID);
        $('#reportName').text(data.Result.Name);
        $('#reportType').text(data.Result.Type);
        $('#reportLocked').text(data.Result.Locked);
        $('#reportCreated').text(data.Result.Created);
        $('#reportUpdated').text(data.Result.Updated);
        $('#reportNotes').text(data.Result.Notes);
        $('#reportJSON').text(data.Result.ReportJSON);
        $('#userJSON').text(data.Result.UserJSON);
    });

    // for(var i=0; i<series.length; i++){
    //     if((series[i].split('/').length > 2)){
    //         var series_item = {
    //             Datasource: series[i].split('/')[0],
    //             Symbol: series[i].split('/')[2],
    //             Datacategory: series[i].split('/')[1]
    //         };
    //     }
    //     else{
    //         var series_item = {
    //             Datasource: series[i].split('/')[0],
    //             Symbol: series[i].split('/')[1]
    //         };
    //     }
        
    //     Series.push(series_item);
    // }        
    
    // parameters = {
    //     Frequency: "d",
    //     Series: Series,
    //     Sparse: true,
    //     SparseOptions: {
    //         Leading: true,
    //         Values: false,
    //         Trailing: true
    //     },
    //     ReturnMetadata: true,
    //     FrequencyOptions: {
    //         AllowWeekends:"off"
    //     }
    // };

    setTimeout(() => {
        CreateAddHeaderRow();
    }, 200);
    
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
                $(".slick-pane").css("position", "unset");
                $(".jqx-tabs-content").css("background-color", "#fff");
                // resizeColumns(grid);
                break
            case 1:
                tab = "chart";
                // if (!isChartLoaded) {
                //     isChartLoaded = true;
                //     createChart(rowsData, columns);
                // }
                // $(".jqx-tabs-content").css("background-color", "#fff");
                break
            case 2:
                tab = "result";
                $(".jqx-tabs-content").css("background-color", "#f2f2f2");
                break
            case 3:
                tab = "request";
                $(".jqx-tabs-content").css("background-color", "#1c2833");
                break
        }
        window.history.pushState("datasetsPage", "report database", "/report_viewer?report_id=" + report_id + "&tab=" + tab + "&layout=" + layout);
    });

    var getDate = function (date) {
        var today = new Date(date),
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
    
    function isIEPreVer9() { var v = navigator.appVersion.match(/MSIE ([\d.]+)/i); return (v ? v[1] < 9 : false); }

    function CreateAddPreHeaderRow() {
        var $preHeaderPanel = $(grid.getPreHeaderPanel())
            .empty()
            .addClass("slick-header-columns")
            .css('left','-1000px')
            .width(grid.getHeadersWidth());
        $preHeaderPanel.parent().addClass("slick-header");
    
        var headerColumnWidthDiff = grid.getHeaderColumnWidthDiff();
        var m, header, lastColumnGroup = '', widthTotal = 0;

        var get_columns = grid.getColumns();
        for (var i = 0; i < get_columns.length; i++) {
            m = get_columns[i];
            if (lastColumnGroup === m.columnGroup && i>0) {
                widthTotal += m.width;
                header.width(widthTotal - headerColumnWidthDiff)
            } else {
                widthTotal = m.width;
                header = $("<div class='ui-state-default slick-header-column' style='white-space: normal; text-overflow:unset'/>")
                .html("<span class='slick-column-name' id='slick-column-name-"+i+"' style='white-space: normal'>" + (m.columnGroup || '') + "</span>")
                .width(m.width - headerColumnWidthDiff)
                .appendTo($preHeaderPanel);
            }
            lastColumnGroup = m.columnGroup;
        }

        // grid.setColumns(get_columns);
        
        setTimeout(() => {
            resizeElements();
        }, 200);
    }
    
    function CreateAddHeaderRow() {
        
        // Define buttons
        var frequency = [{
                name: 'Day',
                value: 'Day'
            },
            {
                name: 'Week',
                value: 'Week'
            },
            {
                name: 'Half Month',
                value: 'HalfMonth'
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

        $("#series_frequency").jqxDropDownList({
            source: frequency,
            displayMember: "name",
            valueMember: "value",
            height: 24,
            placeHolder: "Average",
            selectedIndex: 0
        });

        $("#btnLayout1").jqxButton({
            imgSrc: "resources/css/icons/layout_1.png",
            imgPosition: "center",
            width: 25,
            height: 24,
            imgWidth: 16,
            imgHeight: 18
        });

        $("#btnLayout2").jqxButton({
            imgSrc: "resources/css/icons/layout_2.png",
            imgPosition: "center",
            width: 25,
            height: 24,
            imgWidth: 16,
            imgHeight: 18,
            disabled: true
        });

        $("#btnLayout3").jqxButton({
            imgSrc: "resources/css/icons/layout_3.png",
            imgPosition: "center",
            width: 25,
            height: 24,
            imgWidth: 16,
            imgHeight: 18,
            disabled: true
        });

        $("#decimal").jqxButton({
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

        $("#hideDropdown").jqxDropDownList({
            source: hideDropdownData,
            displayMember: "name",
            valueMember: "value",
            height: 24,
            width:170,
            dropDownHeight: 112,
            placeHolder: '<img height="17" width="17" src="resources/css/icons/starDis_16.png">',
            dropDownHorizontalAlignment: 'right',
            renderer: function (index, label, DatasourceInfo) {
                if (!DatasourceInfo)
                    return label;
                
                imgurl = DatasourceInfo.icon;
                
                if(index<2){
                    var checked = (index == 1) ? '' : '';
                    return '<input type="checkbox" id="checkbox'+index+'" style="margin-right:3px; vertical-align:middle"'+checked+'/><img height="17" width="17" src="' + icons[index] + '"> <span id="databaseDropdown-lable"> ' + label + '</span>';
                }
                else{
                    return '<img height="17" width="17" src="' + icons[index] + '" style="margin-left:15px;"> <span id="databaseDropdown-lable"> ' + label + '</span>';
                }
            },
            selectionRenderer: function (element, index, label, DatasourceInfo) {
                if(index == 0 || index == 1 ){
                    if(rowsData == undefined || rowsData.length == 0){
                        dialogWindow("No Report data has been loaded.", "error");
                    }
                    else{
                        if(index == 0){
                            if($('#checkbox'+index)[0].checked == true){
                                setTimeout(() => {
                                    $('#checkbox'+index)[0].checked = false;
                                    hideEmptyRows = false;
                                }, 5);                                    
                            }
                            else{
                                setTimeout(() => {
                                    $('#checkbox'+index)[0].checked = true;
                                    hideEmptyRows = true;
                                }, 5);
                            }
    
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
                                grid.setData(source.localdata);
                                dataView.beginUpdate();
                                dataView.setItems(source.localdata, "id");
                                dataView.endUpdate();
                                dataView.reSort();
    
                                grid.invalidate();
                                grid.render();
                            }, 50); 
                        }else{
                            dialogWindow("Changing this setting to "+((allow_weekend==true) ? "off":"on")+" requires a server data refresh. <br/>Do you want to continue?", "query", "confirm", "Monitor+ - Allow Weekends", () => {
                                $("#jqxLoader").jqxLoader('open');
                                if($('#checkbox'+index)[0].checked == true){
                                    setTimeout(() => {
                                        $('#checkbox'+index)[0].checked = false;
                                        allow_weekend = false;
                                        
                                        parameters.FrequencyOptions= {
                                            AllowWeekends:"off"
                                        }
    
                                        ShowJSReport(parameters);
                                        // updateChart(rowsData, isChartLoaded, isSubChartLoaded, columns);
                                        $("#jqxLoader").jqxLoader('close');
                                    }, 200);
                                }
                                else{
                                    setTimeout(() => {
                                        $('#checkbox'+index)[0].checked = true;
                                        allow_weekend = true;
                                        parameters.FrequencyOptions= {
                                            AllowWeekends:"on"
                                        }
                                        
                                        ShowJSReport(parameters);
                                        // updateChart(rowsData, isChartLoaded, isSubChartLoaded, columns);
                                        $("#jqxLoader").jqxLoader('close');
                                    }, 200);
                                }
                            }, null, null, { Ok: "Yes", Cancel: "No" });
                        }
                    }
                }
                else if(index == 2){
                    if (!hasUserAccessToCategory)
                        return;

                    if(rowsData == undefined || rowsData.length == 0){
                        dialogWindow("No Report data has been loaded.", "error");
                    }
                    else{
                        makeExportSeriesDialog();
                    }
                }
                else if(index == 3){
                    if(rowsData == undefined || rowsData.length == 0){
                        dialogWindow("No Report data has been loaded.", "error");
                    }
                    else{
                        $("#jqxLoader").jqxLoader('open');
                        let freq = $("#series_frequency").val().replace(/[^A-Z]/g, '').toLowerCase();
                        // parameters.Frequency = freq;
                        setTimeout(() => {
                            var jsonObj = getJsonTree(request_editor);
                            if(jsonObj != undefined){
                                if(jsonObj.Frequency != undefined && jsonObj.Series != undefined){
                                    ShowJSReport(jsonObj);
                                    gridColumndraw();
                                    grid.setColumns(columns);
                                    CreateAddPreHeaderRow();
                                    resizeColumns(grid);
                                    $("#jqxLoader").jqxLoader('close');
                                }
                                else{
                                    $("#jqxLoader").jqxLoader('close');
                                    dialogWindow("The selected file cannot be used. <br/>It was not created  with the 'Save JSON' function", "error");
                                }
                                // updateChart(rowsData, isChartLoaded, isSubChartLoaded, columns);
                            }                        
                        }, 20);
                    }
                }
                
                imgurl = 'resources/css/icons/setting_16.png';

                return '<img height="17" width="17" src="' + imgurl + '" id="selectedItemDropMenu" class="seletedItemStyle" valign="center">';
            }
        });

        $("#btnAutosizeSeries").jqxButton({
            imgSrc: "resources/css/icons/autosize.png",
            imgPosition: "center",
            width: 25,
            height: 24,
            imgWidth: 16,
            imgHeight: 16
        });
        $("#btnAutosizeSeries").jqxTooltip({
            content: 'Autosize columns',
            position: 'mouse',
            name: 'movieTooltip'
        });

        $("#fullWidth1").jqxButton({
            imgSrc: "resources/css/icons/fullscreen.png",
            imgPosition: "center",
            width: 25,
            height: 24,
            imgWidth: 16,
            imgHeight: 16
        });
        $("#fullWidth1").jqxTooltip({
            content: 'Toggle grid to full screen width',
            position: 'mouse',
            name: 'movieTooltip'
        });
        
        // When select item from dropmenu
        $("#series_frequency").on('select', function (event) {
            if(getSession() == undefined || getSession() == ""){
                $('body').addClass('overlay');
                $('#loginPopup').jqxWindow('open');
                $('#loginPopup').css('z-index', 999999);
                $('#loginPopup .jqx-window-header div').css("float", "none");
            }
            else{
                if(rowsData == undefined || rowsData.length == 0){
                    dialogWindow("No Report data has been loaded.", "error");
                }
                else{
                    var args = event.args;
                    if (args) {
                        let freq = args.item.value.replace(/[^A-Z]/g, '').toLowerCase();

                        parameters.Frequency = freq;
                        if(allow_weekend == false){
                            parameters.FrequencyOptions= {
                                AllowWeekends:"off"
                            }
                        }

                        setTimeout(() => {
                            ShowJSReport(parameters);
                            // updateChart(rowsData, isChartLoaded, isSubChartLoaded, columns);
                        }, 5);
                    }
                }
            }
        });

        $("#btnLayout1").on('click', function () {
            $('#bottomSplitter').jqxSplitter('collapse');
            $('#pricesSplitter').jqxSplitter('collapse');
            window.history.pushState("datasetsPage", "report database", "/report_viewer?report_id=" + report_id + "&tab=prices&layout=1");
        });

        $("#btnLayout2").on('click', function () {
            // if (!isSubChartLoaded) {
            //     isSubChartLoaded = true;
            //     createSubChart(rowsData, columns);                
            // }
            // $('#bottomSplitter').jqxSplitter('collapse');
            // $('#pricesSplitter').jqxSplitter('expand');
            // window.history.pushState("datasetsPage", "report database", "/report_viewer?report_id=" + report_id + "&tab=prices&layout=2");
        });

        $("#btnLayout3").on('click', function () {
            // $('#bottomSplitter').jqxSplitter('expand');
            // $('#pricesSplitter').jqxSplitter('expand');
            // window.history.pushState("datasetsPage", "report database", "/report_viewer?report_id=" + report_id + "&tab=prices&layout=3");
            // if (!isSubChartLoaded) {
            //     isSubChartLoaded = true;
            //     createSubChart(rowsData, columns);
            // }
        });

        $("#decimal").on("click", function () {
            frame.css({
                left: $("#decimal").offset().left,
                top: $("#decimal").offset().top + 24
            }).toggle(frame.css('display') == 'none').find('.deci2').val('0.' + decimalText);
            decimalNumber = real_decimal;
        });

        $("#btnAutosizeSeries").on("click", function () {
            resizeColumns(grid);            
        });

        fullWidthFlag = true;
        $("#fullWidth1").on('click', function () {
            let img = (fullWidthFlag) ? 'fullscreen1' : 'fullscreen';

            $("#fullWidth1").jqxButton({
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

        $(document).on('click', '.bb-ok', function () {
            real_decimal = decimalNumber;            
            $('.popup-win').hide();
            resizeColumns(grid);
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
    
    function gridColumndraw(){
        columns = [{
            id: "sel",
            name: ' ',
            sortable: true,
            filterable: false,
            field: 'num',
            columntype: 'number',
            width: 50,
            cellsformat: '',
            formatter: function (row, field, value, html, columnproperties, record) {
                let className = "";
                if (Object.keys(data_corr).includes(columnproperties.Date)) {
                    let data = data_corr[columnproperties.Date];
                    if (data !== undefined) {
                        // if (data.date !== undefined && (data.column.includes(field) || field == ''))
                            if (columnproperties.Date == data.date)
                                className = "corr_selected";
                    }
                }
                let date = new Date(columnproperties.Date);
                if (columnproperties.Date !== undefined && (date.getDay() == 6 || date.getDay() == 0) && highlight_weekends)
                    className = "highlightBG";
                return "<div class='"+className+" cell-title cell-right'>" + (value) + "</div>";
            }
        },
        {
                id: "date",
                name: 'Date',
                field: 'Date',
                sortable: true,
                width: 100,
                formatter: function (row, field, value, html, columnproperties, record) {
                    let className = "";
                    if (Object.keys(data_corr).includes(columnproperties.Date)) {
                        let data = data_corr[columnproperties.Date];
                        if (data !== undefined) {
                            // if (data.date !== undefined && (data.column.includes(field) || field == ''))
                                if (columnproperties.Date == data.date)
                                    className = "corr_selected";
                        }
                    }
                    if (highlight_weekends) {
                        let date = new Date(value);
                        if (date.getDay() == 6 || date.getDay() == 0)
                            className = className !== "" ? className + " highlightWeekends" : "highlightWeekends";
                    }
                    return "<div class='"+className+" cell-title cell-right'>" + value + "</div>";
                }
            },
        ];

        for (var i in bates) {
            let name = bates[i].name;
            name = name.split("(calculated)").join("(c)");

            if (name == "Adjusted_Close")
                name = "Adj. Close";

            if (!["Date", "corrected", "correction_count", "correction_bates"].includes(bates[i].name))
            {
                if(bates[i].category == undefined)
                    var columnGroup = bates[i].description+" ["+bates[i].datasource+"/"+bates[i].symbol+"]";
                else
                    var columnGroup = bates[i].description+" ["+bates[i].datasource+"/"+bates[i].category+"/"+bates[i].symbol+"]";
                
                var jsonColumn = {
                    id: bates[i].id,
                    name: name,
                    field: bates[i].id,
                    filtertype: "float",
                    sortable: true,
                    cellsformat: "",
                    columnGroup: columnGroup,
                    formatter: function (row, field, value, html, columnproperties, record) {
                        let className = "";
                        if (Object.keys(data_corr).includes(columnproperties.Date)) {
                            let data = data_corr[columnproperties.Date];
                            if (data !== undefined) {
                                // if (data.date !== undefined && (data.column.includes(field) || field == ''))
                                    if (columnproperties.Date == data.date)
                                        className = "corr_selected";
                            }
                        }
                        let date = new Date(columnproperties.Date);
                        if (columnproperties.Date !== undefined && (date.getDay() == 6 || date.getDay() == 0) && highlight_weekends)
                            className = "highlightBG";

                        value = !isNumberFunc(value) ? value : parseFloat(value).toFixed(html.name.toLowerCase() == "volume" ? 0 : real_decimal);
                        value = (value == 'NA') ? '<span id="NoValue">N/A<span>' : (value == null) ? "" : value;
                        return "<div class='"+className+" cell-title cell-right'>" + (value) + "</div>";
                    }
                }

                if(bates[i].datasource == "ECBFX"){
                    jsonColumn.minWidth = 100;
                }


                columns.push(jsonColumn);
            }
        }
    }

    gridColumndraw();

    var options = {
        columnPicker: {
            columnTitle: "Columns",
            hideForceFitButton: false,
            hideSyncResizeButton: false,
            forceFitTitle: "Force fit columns",
            syncResizeTitle: "Synchronous resize",
        },
        editable: true,
        enableAddRow: false,
        enableCellNavigation: true,
        autosizeColsMode: Slick.GridAutosizeColsMode.FitColsToViewport,
        enableColumnReorder: false,
        createPreHeaderPanel: true,
        showPreHeaderPanel: true,
        preHeaderPanelHeight: 50,
        multiColumnSort: true,
        asyncEditorLoading: true,
        forceFitColumns: false,
        rowHeight: 30,
        explicitInitialization: true,
    };

    var sortcol = "title";
    var sortdir = 1;
    var percentCompleteThreshold = 0;
    var searchString = "";

    function requiredFieldValidator(value) {
        if (value == null || value == undefined || !value.length) {
            return {valid: false, msg: "This is a required field"};
        }
        else {
            return {valid: true, msg: null};
        }
    }

    function myFilter(item, args) {
        if (item["percentComplete"] < args.percentCompleteThreshold) {
            return false;
        }

        if (args.searchString != "" && item["title"].indexOf(args.searchString) == -1) {
            return false;
        }

        return true;
    }

    function percentCompleteSort(a, b) {
        return a["percentComplete"] - b["percentComplete"];
    }

    function convert_to_float(x) {
        var converted = parseFloat(x);
        return isNaN(converted) ? x : converted
    }
    
    function comparer1(a, b) {
        var x = convert_to_float(a[sortcol]), y = convert_to_float(b[sortcol]);
        return (x == y ? 0 : (x > y ? 1 : -1));
    }
    
    function comparer(a, b) {
        var x = a[sortcol], y = b[sortcol];
        return (x == y ? 0 : (x > y ? 1 : -1));
    }

    function toggleFilterRow() {
        grid.setTopPanelVisibility(!grid.getOptions().showTopPanel);
    }

    if(source.localdata == undefined)
        source.localdata = [];

    $(function () {
        // prepare the data
        for (var i = 0; i < source.localdata.length; i++) {
            source.localdata[i].id = "id_" + i;
            source.localdata[i].num = (i+1);

            if(source.localdata[i].Close == null){
                source.localdata[i].Close = "";
            }

            if(source.localdata[i].High == null){
                source.localdata[i].High = "";
            }

            if(source.localdata[i].Low == null){
                source.localdata[i].Low = "";
            }

            if(source.localdata[i]['Mean (c)'] == null){
                source.localdata[i]['Mean (c)'] = "";
            }

            if(source.localdata[i]['Hi-Lo (c)'] == null){
                source.localdata[i]['Hi-Lo (c)'] = "";
            }
        }

        dataView = new Slick.Data.DataView({ inlineFilters: true });
        grid = new Slick.Grid("#jqxgrid", dataView, columns, options);
        grid.setSelectionModel(new Slick.RowSelectionModel());

        // move the filter panel defined in a hidden div into grid top panel
        $("#inlineFilterPanel")
            .appendTo(grid.getTopPanel())
            .show();

        grid.onCellChange.subscribe(function (e, args) {
            dataView.updateItem(args.item.id, args.item);
        });

        grid.onClick.subscribe(function(e, args) {
        });

        grid.onScroll.subscribe(function(e, args) {
            $("#jqxgrid div.grid-canvas .selected").children().removeClass("highlightBG");
            $("#jqxgrid div.grid-canvas .selected").children().removeClass("highlightWeekends");
        });

        grid.onSelectedRowsChanged.subscribe(function () {
            var rowsObj = $("#jqxgrid div.grid-canvas").find("div.slick-row");
            for(var i=0; i<rowsObj.length; i++){
                let date = new Date($("#jqxgrid div.grid-canvas").children().eq(i).children('.r1').children().text());
                if (date !== undefined && (date.getDay() == 6 || date.getDay() == 0) && highlight_weekends){
                    for(var j=0; j<columns.length; j++){
                        $("#jqxgrid div.grid-canvas").children().eq(i).children('.r'+j).children().addClass("highlightBG");
                    }
                }
            }
            
            setTimeout(() => {
                $("#jqxgrid div.grid-canvas .selected").children().removeClass("highlightBG");
                $("#jqxgrid div.grid-canvas .selected").children().removeClass("highlightWeekends");
            }, 10);
        });

        grid.onContextMenu.subscribe(function (e) {
            e.preventDefault();
            var cell = grid.getCellFromEvent(e);
            var indexes = grid.getSelectedRows()
            indexes.push(cell.row);
            grid.setSelectedRows(indexes)

            $("#jqxgridMenu")
                .data("row", cell.row)
                .css("top", e.pageY)
                .css("left", e.pageX)
                .show();

            $("body").one("click", function () {
              $("#jqxgridMenu").hide();
            });

            setTimeout(() => {
                $("#jqxgrid div.grid-canvas .selected").children().removeClass("highlightBG");
                $("#jqxgrid div.grid-canvas .selected").children().removeClass("highlightWeekends");
            }, 10);
        });

        grid.onAddNewRow.subscribe(function (e, args) {
        });

        grid.onKeyDown.subscribe(function (e) {
            // select all rows on ctrl-a
            if (e.which != 65 || !e.ctrlKey) {
                return false;
            }

            var rows = [];
            for (var i = 0; i < dataView.getLength(); i++) {
                rows.push(i);
            }

            grid.setSelectedRows(rows);
            e.preventDefault();
        });

        grid.onSort.subscribe(function (e, args) {
            sortdir = args.sortCols[0].sortAsc ? 1 : -1;
            sortcol = args.sortCols[0].sortCol.field;
            
            if (isIEPreVer9()) {
                var percentCompleteValueFn = function () {
                    var val = this["percentComplete"];
                    if (val < 10) {
                        return "00" + val;
                    } else if (val < 100) {
                        return "0" + val;
                    } else {
                        return val;
                    }
                };

                // use numeric sort of % and lexicographic for everything else
                dataView.fastSort((sortcol == "percentComplete") ? percentCompleteValueFn : sortcol, args.sortCols[0].sortAsc);
            } else {
                // using native sort with comparer
                // preferred method but can be very slow in IE with huge datasets
                if(sortcol == "Date")
                    dataView.sort(comparer, args.sortCols[0].sortAsc);
                else
                    dataView.sort(comparer1, args.sortCols[0].sortAsc);
            }

        });

        // wire up model events to drive the grid
        // !! both dataView.onRowCountChanged and dataView.onRowsChanged MUST be wired to correctly update the grid
        // see Issue#91
        dataView.onRowCountChanged.subscribe(function (e, args) {
            grid.updateRowCount();
            grid.render();
        });

        dataView.onRowsChanged.subscribe(function (e, args) {
            grid.invalidateRows(args.rows);
            grid.render();            
        });

        dataView.onRowCountChanged.subscribe(function (e, args) {
            grid.updateRowCount();
            grid.render();
        });

        dataView.onPagingInfoChanged.subscribe(function (e, pagingInfo) {
            grid.updatePagingStatusFromView( pagingInfo );

            // show the pagingInfo but remove the dataView from the object, just for the Cypress E2E test
            delete pagingInfo.dataView;
        });

        dataView.onBeforePagingInfoChanged.subscribe(function (e, previousPagingInfo) {
            // show the previous pagingInfo but remove the dataView from the object, just for the Cypress E2E test
            delete previousPagingInfo.dataView;
        });

        var h_runfilters = null;

        // wire up the slider to apply the filter to the model
        $("#pcSlider,#pcSlider2").slider({
            "range": "min",
            "slide": function (event, ui) {
                Slick.GlobalEditorLock.cancelCurrentEdit();

                if (percentCompleteThreshold != ui.value) {
                    window.clearTimeout(h_runfilters);
                    h_runfilters = window.setTimeout(updateFilter, 10);
                    percentCompleteThreshold = ui.value;
                }
            }
        });

        // wire up the search textbox to apply the filter to the model
        $("#txtSearch,#txtSearch2").keyup(function (e) {
            Slick.GlobalEditorLock.cancelCurrentEdit();

            // clear on Esc
            if (e.which == 27) {
            this.value = "";
            }

            searchString = this.value;
            updateFilter();
        });

        function updateFilter() {
            dataView.setFilterArgs({
                percentCompleteThreshold: percentCompleteThreshold,
                searchString: searchString
            });
            dataView.refresh();
        }

        $("#btnSelectRows").click(function () {
            if (!Slick.GlobalEditorLock.commitCurrentEdit()) {
                return;
            }

            var rows = [];
            for (var i = 0; i < 10 && i < dataView.getLength(); i++) {
                rows.push(i);
            }
            grid.setSelectedRows(rows);
        });

        grid.init();

        grid.onColumnsResized.subscribe(function (e, args) {
            setTimeout(() => {
                CreateAddPreHeaderRow();
            }, 50);
        });

        // initialize the model after all the events have been hooked up
        dataView.beginUpdate();
        dataView.setItems(source.localdata);
        dataView.setFilterArgs({
            percentCompleteThreshold: percentCompleteThreshold,
            searchString: searchString
        });
        dataView.setFilter(myFilter);
        dataView.endUpdate();

        // if you don't want the items that are not visible (due to being filtered out
        // or being on a different page) to stay selected, pass 'false' to the second arg
        dataView.syncGridSelection(grid, true);

        $("#gridContainer").resizable();

        cols = grid.getColumns();
        let y = [];
        for (c in cols) {
            if (cols[c].name !== "#" && cols[c].name !== "Date")
                y.push(cols[c].name);
        }

        $('#cols').text(y.join(', '));

        //$("#jqxgrid").toggleClass('watermark', disabledGrid);
        if (expired && !disabledGrid) $("#jqxgrid").toggleClass('watermark access', expired);

        resizeColumns(grid);
        CreateAddPreHeaderRow();
    });

    // Change text of loading message form "Loading..." to "Requesting Data.."
    $('#jqxgrid').find('div.jqx-grid-load').next().text('Requesting Data...').css({
        'font-family': 'Calibri',
        'font-size': '14px',
        'color': '#333'
    }).parent().parent().width(153);

    $("#jqxgrid").on("columnresized", function (event) {
        var args = event.args,
            newCols = grid.getColumns();

        for (var i = 0; i < newCols.length; i++) {
            if (args.field != newCols[i].field) {
                newCols[i].width = cols[i].width;
            }
        }
        grid.setColumns(newCols);
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
        switch ($.trim($(args).text())) {
            case "Select All":
                var sel_columns = [];
                if(grid.getData().length == undefined)
                    var rows = grid.getData().getItems();
                else
                    var rows = grid.getData();
                for (var k in rows) {
                    sel_columns.push(k);
                }                
                grid.setSelectedRows(sel_columns);
                break;

            case "Copy":
                copySelectedSeriesToClipboard();
                break;

            case "Highlight weekends":
                highlight_weekends = !highlight_weekends;
                $(".highlight-weekends").toggle(highlight_weekends);
                grid.setColumns(columns);
                break;
        }
    });

    function copySelectedSeriesToClipboard() {
        var rowsindexes = grid.getSelectedRows();
        var rows = [];
        for (var i = 0; i < rowsindexes.length; i++) {
            rows[rows.length] = grid.getDataItem(rowsindexes[i]);
        }

        var Results = getRowsData();

        Results.splice(1, 4);
        // Results.splice(0, 1, ["Name:", gridMetadata.Name + ' (' + full_symbol + ')']);

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

    $("button.ui-button").click(function () {
        setTimeout(() => {
            $('#request-json-display').parent().css('height', parseInt($('#jqxTabs').height())-195);
            $('#notes-json-display').parent().css('height', parseInt($('#jqxTabs').height())-195);
            $('#user-json-display').parent().css('height', parseInt($('#jqxTabs').height())-195);
        }, 10);
    });

    function resizeElements() {
        var contentBottomPadding = parseInt($(".main-content").css("padding-bottom"));
        $('#mainSplitter').css('min-height', (window.innerHeight - $(".navbar").height() - contentBottomPadding + 16) + 'px');
        preHeaderColumnHeight = 0;

        setTimeout(() => {
            
            // $('#request-json-body').parent().css('height', parseInt($('#jqxTabs').height())-152);
            $('#request-json-display').parent().css('height', parseInt($('#jqxTabs').height())-195);
            $('#notes-json-display').parent().css('height', parseInt($('#jqxTabs').height())-195);
            $('#user-json-display').parent().css('height', parseInt($('#jqxTabs').height())-195);
            // $('#response-json-display').parent().css('height', parseInt($('#jqxTabs').height())-40);
            $('#response-json-display').css('height', parseInt($('#jqxTabs').height())-77);
            $('#response-json-display pre').css('height', '100%');
        }, 50);
        
        setTimeout(() => {
            $('#jqxgrid').css('width', '100%').css('height', (parseInt($('#jqxTabs').css('height').slice(0,-2))-75));
            for (var i = 0; i < columns.length; i++) {
                if(preHeaderColumnHeight < parseInt($('#slick-column-name-'+i).height()) && parseInt($('#slick-column-name-'+i).height()) < 200){
                    preHeaderColumnHeight = parseInt($('#slick-column-name-'+i).height());
                }
            }

            // alert(parseInt($('#pricesSplitter').css('height').slice(0,-2)));
            
            $('.slick-preheader-panel').css("height", preHeaderColumnHeight+10);
            $('.slick-preheader-panel .slick-header-columns').css("height", preHeaderColumnHeight+10);
            grid.resizeCanvas();
        }, 100);

        setTimeout(() => {
            var grid_height = parseInt($('#jqxgrid').height());
            $('#jqxgrid .slick-pane-top').css('height', (grid_height-preHeaderColumnHeight-17));
            $('#jqxgrid .slick-viewport').css('height', (grid_height-preHeaderColumnHeight-45));

            $("#bottomSplitter").parent().css("height", "100%");
        }, 150); 
    }

    $(window).resize(function () {
        resizeElements();
    });
    resizeElements();

    $('#exportDialogWindow').jqxWindow({
        showCollapseButton: false,
        resizable: false,
        height: 330,
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
        if(grid.getData().length == undefined)
            var rows = grid.getData().getItems();
        else
            var rows = grid.getData();
        $('#exportDialogWindow #num').text(rows.length);
        if (grid.getSelectedRows().length == 0) {
            $("#export-one").prop('disabled', true);
            $("#export-all").prop('checked', true);
        } else {
            $("#export-all, #export-one").prop('disabled', false);
            $("#export-one").prop('checked', true);
        }
        let record = (grid.getSelectedRows().length > 1) ? "records" : "record";
        let msg = "Export the " + grid.getSelectedRows().length + " selected " + record;
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
            var indexes = grid.getSelectedRows();

            if (indexes.length == 0) {
                dialogWindow("Please select at least one date", "error");
                return;
            } else {
                indexes.forEach(function (item, i, indexes) {
                    rows = grid.getDataItem(indexes[i]);
                    let data = columns.map(function (v) {
                        if (v.field == "Date") {
                            var date = new Date(rows[v.field]),
                                day = date.getDate(),
                                month = date.getMonth() + 1,
                                year = date.getFullYear();
                            day = (day < 10) ? '0' + day : day;
                            month = (month < 10) ? '0' + month : month;
                            return year + '-' + month + '-' + day;
                        }
                        return (rows[v.field] == undefined || rows[v.field] == null) ? "" : parseFloat(rows[v.field]).toFixed(real_decimal);
                    });
                    datasets.push(data.slice(1));
                });
            }
        } else if (export_type == "all") {
            if(grid.getData().length == undefined)
                var items = grid.getData().getItems();
            else
                var items = grid.getData();

            items.forEach(function (rows) {
                let data = columns.map(function (v) {
                    if (v.field == "Date") {
                        var date = new Date(rows[v.field]),
                            day = date.getDate(),
                            month = date.getMonth() + 1,
                            year = date.getFullYear();
                        day = (day < 10) ? '0' + day : day;
                        month = (month < 10) ? '0' + month : month;
                        return year + '-' + month + '-' + day;
                    }
                    return (rows[v.field] == undefined) ? "" : rows[v.field];
                });
                datasets.push(data.slice(1));
            });
        }

        Results = [
            ["Report Name:", report_name],
            ["Average:", frequency],
            ["Start Date:", startDate],
            ["End Date:", endDate],
        ];

        Results.push(columns.map(v => v.name).slice(1));
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

        var file_type = $('input[name="file_type"]:checked').val();
        if(file_type == "csv"){
            var CsvString = "";
            Results.forEach(function (RowItem, RowIndex) {
                RowItem.forEach(function (ColItem, ColIndex) {
                    if (ColItem == "" || ColItem == "NaN") ColItem = " ";
                    CsvString += '"' + ColItem.toString() + '",';
                });
                CsvString += "\r\n";
            });

            CsvString = "data:application/csv," + encodeURIComponent(CsvString);

            var link = document.createElement("a");
            link.href = CsvString;
            link.download = report_name+".csv";
            link.click();
        }else{
            var uri = 'data:application/vnd.ms-excel;base64,',
            template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>',
            base64 = function(s) {
                return window.btoa(unescape(encodeURIComponent(s)))
            },
            format = function(s, c) {
                return s.replace(/{(\w+)}/g, function(m, p) {
                    return c[p];
                })
            }

            var table = "<table>";
            Results.forEach(function (RowItem, RowIndex) {
                if(RowIndex == 4){
                    table += "<tr><td></td>";
                    var columnGroup = "";
                    var colspan = 1;
                    columns.forEach(function (column, RowIndex) {
                        if (!["#", "Date", "corrected", "correction_count", "correction_bates"].includes(column.name)){
                            if(columnGroup == column.columnGroup){
                                colspan++;
                            }
                            else if(columnGroup != "" && columnGroup != column.columnGroup){
                                table += "<td colspan = '"+colspan+"' align='center'>"+columnGroup+"</td>";
                                colspan = 1;
                            }
                            columnGroup = column.columnGroup;
                        }
                    });
                    table += "<td colspan = '"+colspan+"' align='center'>"+columnGroup+"</td>";
                    table += "</tr>";
                }

                table += "<tr>";
                RowItem.forEach(function (ColItem, ColIndex) {
                    if (ColItem == "" || ColItem == "NaN") ColItem = " ";
                    table += "<td>"+ColItem.toString()+"</td>";
                });
                table += "</tr>";
            });            
            table += "</table>";

            var toExcel = table;
            var ctx = {
                worksheet: "sheet1" || '',
                table: toExcel
            };
            var link = document.createElement("a");
            link.download = report_name+".xls";
            link.href = uri + base64(format(template, ctx))
            link.click();
        }
    }


    // var meta_rows = $("#metadataContent").find("div"),
    //     size = 1.35 * (meta_rows[0].offsetHeight + meta_rows[1].offsetHeight);
  
    $('#mainSplitter').jqxSplitter({
        height: '100%',
        width: '100%',
        orientation: 'horizontal',
        panels: [{
            size: "65px",
        }, {
            size: "50%",
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
        width: '100.25%',
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
        if (linessubchart !== undefined && $('#subchart').width() > 10) {
            window.dispatchEvent(new Event('resize'));
        }
    });

    $('#pricesSplitter').on('resize', function (e) {
      setTimeout(() => {
        $('.left-toolbar-button').css('display', 'block');
        $('.right-toolbar-content').css('justify-content', 'flex-end').css('margin-left', 'auto');
      }, 50);
        if (linessubchart !== undefined && $('#subchart').width() > 10) {
            window.dispatchEvent(new Event('resize'));
        }
    });

    $('#pricesSplitter').on('expanded', function (e) {
        if (!isSubChartLoaded) {
            isSubChartLoaded = true;
            createSubChart(rowsData, columns);
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
        $('#bottomSplitter').jqxSplitter('collapse');
        $('#pricesSplitter').jqxSplitter('expand');
    } else if (layout == 3 || corrections_count > 0) {
        if (!isSubChartLoaded) {
            isSubChartLoaded = true;
            createSubChart(rowsData, columns);
        }
        $('#bottomSplitter').jqxSplitter('expand');
        $('#pricesSplitter').jqxSplitter('expand');
    } else {
        $('#bottomSplitter').jqxSplitter('collapse');
        $('#pricesSplitter').jqxSplitter('collapse');
    }

    if (requestedTab != null && requestedTab != '') {
        if (requestedTab == 'chart') {
            // $('#jqxTabs').jqxTabs('select', 1);
            // if (!isChartLoaded) {
            //     isChartLoaded = true;
            //     createChart(rowsData, columns);
            // }
        } else if (requestedTab == 'request') {
            $('#jqxTabs').jqxTabs('select', 3);
        } else if (requestedTab == 'result') {
            $('#jqxTabs').jqxTabs('select', 2);
        }
        else window.history.pushState("datasetsPage", " database", "/report_viewer?report_id=" + report_id + "&tab=prices" + layoutURL);
    } else window.history.pushState("datasetsPage", " database", "/report_viewer?report_id=" + report_id + "&tab=prices" + layoutURL);


    function CreateAddRequestHeaderRow() {
        
        var frequency_json = [{
                name: 'Day',
                value: 'Day'
            },
            {
                name: 'Week',
                value: 'Week'
            },
            {
                name: 'Half Month',
                value: 'HalfMonth'
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

        $("#series_frequency_json").jqxDropDownList({
            source: frequency_json,
            displayMember: "name",
            valueMember: "value",
            height: 24,
            placeHolder: "Average",
            selectedIndex: 0
        });

        $('#allowEdit').jqxSwitchButton({ height: 24, width: 60,  checked: false });

        $('#allowEdit').on('change', function (event) {
            var jsonObj = getJsonTree(request_editor);
            var jsonObj1 = getJsonTree(notes_editor);
            var jsonObj2 = getJsonTree(user_editor);
            if(jsonObj != undefined){
                if(event.args.checked == false){
                    request_editor = new JsonEditor('#request-json-display', jsonObj, {editable: false});
                    notes_editor = new JsonEditor('#notes-json-display', jsonObj1, {editable: false});
                    user_editor = new JsonEditor('#user-json-display', jsonObj2, {editable: false});
                }
                else{
                    request_editor = new JsonEditor('#request-json-display', jsonObj, {editable: true});
                    notes_editor = new JsonEditor('#notes-json-display', jsonObj1, {editable: true});
                    user_editor = new JsonEditor('#user-json-display', jsonObj2, {editable: true});
                }
            }
        });

        // When select item from dropmenu
        $("#series_frequency_json").on('select', function (event) {
            var args = event.args;
            if (args) {
                let freq_json = args.item.value.replace(/[^A-Z]/g, '').toLowerCase();
                
                parameters.Frequency = freq_json;
                if(allow_weekend == false){
                    parameters.FrequencyOptions= {
                        AllowWeekends:"off"
                    }
                }
                setTimeout(() => {
                    ShowJSReport(parameters);
                    // updateChart(rowsData, isChartLoaded, isSubChartLoaded, columns);
                }, 5);
                // edit_flag = true;
            }                              
        });

        $("#btnRequestLoadReport").jqxButton({
            imgSrc: "resources/css/icons/fileopen.png",
            imgPosition: "left",
            width: 100,
            height: 24,
            textPosition: "right"
        });
        $("#btnRequestLoadReport").css("border-color", "#ddd").css("box-shadow", "0px 0 2px rgb(0 0 0 / 25%)");
        $("#btnRequestLoadReport span").css("left", 25);

        $("#btnRequestLoadReport").on('click', function () {
            var jsonObj = getJsonTree(request_editor);
            var jsonObj1 = getJsonTree(notes_editor);
            var jsonObj2 = getJsonTree(user_editor);
            if(JSON.stringify(jsonObj) != JSON.stringify(requestParameters) || jsonObj1 != notesParameters || JSON.stringify(jsonObj2) != JSON.stringify(userParameters)){
                edit_flag = true;
            }

            if(edit_flag == true){
                dialogWindow("The report may have been changed.<br/>If you load a new report you my lose these changes.<br>Do you want to lose any changes", "query", "confirm", "Monitor+ - Allow Weekends", () => {
                    // $('#fileupload').trigger('click');
                    $('#report_list').trigger('click');
                    // $('#report_list')
                }, null, null, { Ok: "Yes", Cancel: "No" });
            }
            else{
                // $('#fileupload').trigger('click');
                $('#report_list').trigger('click');
            }
        });

        $("#btnRequestSaveReport").jqxButton({
            imgSrc: "resources/css/icons/filesave.png",
            imgPosition: "left",
            width: 100,
            height: 24,
            textPosition: "right"
        });
        $("#btnRequestSaveReport").css("border-color", "#ddd").css("box-shadow", "0px 0 2px rgb(0 0 0 / 25%)");
        $("#btnRequestSaveReport span").css("left", 25);

        $("#btnRequestSaveReport").on('click', function () {
            if(getSession() == undefined || getSession() == ""){
                $('body').addClass('overlay');
                $('#loginPopup').jqxWindow('open');
                $('#loginPopup').css('z-index', 999999);
                $('#loginPopup .jqx-window-header div').css("float", "none");
            }
            else{
                var jsonObj = getJsonTree(request_editor);
                var jsonObj1 = getJsonTree(notes_editor);
                var jsonObj2 = getJsonTree(user_editor);
                if(jsonObj == undefined || !(jsonObj.Frequency != undefined && jsonObj.Series != undefined)){
                    dialogWindow("The Request tab must contain valid JSON code.", "error");
                }
                else{
                    call_api_ajax1('ListReports', 'get', {
                        SessionToken: getSession()
                    }, false, (data) => {
                        for (var i = 0; i < data.Result.length; i++) {
                            reportsList.push({
                                ReportID: data.Result[i].ReportID,
                                Name: data.Result[i].Name,
                                Type: data.Result[i].Type,
                                Locked: data.Result[i].Locked
                            });
                            if(report_name == data.Result[i].Name)
                                selectReportIndex = i;
                        }
                    });
        
                    $("#reportsList").jqxComboBox({placeHolder: "Select Item", source: reportsList, displayMember: "Name", valueMember: "Name", width: 'calc( 100% - 45px )', height: 30, itemHeight: 30});
                    $("#reportsList").jqxComboBox("selectedIndex", selectReportIndex);
        
                    $('body').addClass('overlay');
                    $('#saveReportWindow').jqxWindow('open');
                    $("#saveReportWindow").css("min-width", 510).css("min-height", 370);
                }
            }
        });

        $('#saveReportWindow').on('close', function () {
            $('body').removeClass('overlay');
        });

        $('#saveReportWindow').jqxWindow({
            showCollapseButton: false,
            resizable: true,
            isModal: false,
            height: '370px',
            width: '600px',
            maxHeight: '100%',
            maxWidth: '100%',
            autoOpen: false,
            title: 'Save Server Report'
        });

        $('#saveReportWindow').on('resized', function (event) {
            $('#saveReportWindow .jqx-window-content').css("width", "calc(100% - 10px)").css("overflow", "unset");
            $("#reportsList").jqxComboBox("width", "calc( 100% - 45px )");
            // $("#reportsList").jqxComboBox("dropDownHeight", parseInt($('#saveReportWindow').height())-240);
            $("#saveReportLockedRow").css("height", parseInt($('#saveReportWindow').height())-270);            
        });

        $("#btnSaveReport").jqxButton({
            width: '60px',
            height: '35px',
            textPosition: "center"
        });
        $("#btnSaveReport span").css("left", 16).css("top", 7);

        $("#btnSaveReport").on('click', function () {
            if(getSession() == undefined || getSession() == ""){
                $('body').addClass('overlay');
                $('#loginPopup').jqxWindow('open');
                $('#loginPopup').css('z-index', 999999);
                $('#loginPopup .jqx-window-header div').css("float", "none");
            }
            else{
                var checked = $("#createCloneReport").jqxCheckBox('checked');
                if(checked == true){
                    if($("#reportsList").jqxComboBox("selectedIndex") > -1){
                        dialogWindow("Create a copy of report "+reportsList[$("#reportsList").jqxComboBox("selectedIndex")].Name+"?", 'query', 'confirm', null,
                            function () {
                                call_api_ajax1('ReadReport', 'get', {
                                    SessionToken: getSession(),
                                    ReportID:reportsList[$("#reportsList").jqxComboBox("selectedIndex")].ReportID
                                }, false, (data) => {
                                    var params = {
                                        SessionToken: getSession(),
                                        Name: data.Result.Name+" (Copy)",
                                        Type: data.Result.Type,
                                        Notes: data.Result.Notes,
                                        ReportJSON: data.Result.ReportJSON,
                                        UserJSON: data.Result.UserJSON
                                    };
                                    call_api_ajax1('WriteReport', 'post', JSON.stringify(params), false);                            
                                });
                                // updateReportListCombobox();
                                resizeElements();
                                $('#saveReportWindow').jqxWindow("close");
                            }, null, null, {
                                Ok: 'Yes',
                                Cancel: 'No'
                            }
                        )
                    }
                    else{
                        dialogWindow("Please select a report to copy", "error");
                    }
                }
                else{
                    var value = $("#reportsList input").val();
                    if(value == ""){
                        dialogWindow("You must enter a report name to save", "error");
                    }
                    else{
                        var existReportID, existLocked = "";
                        for(var i=0; i<reportsList.length; i++){
                            if(reportsList[i].Name == value){
                                existReportID = reportsList[i].ReportID;
                                existLocked = reportsList[i].Locked;
                                break;
                            }
                        }

                        var jsonObj = getJsonTree(request_editor);
                        var jsonObj1 = getJsonTree(notes_editor);
                        var jsonObj2 = getJsonTree(user_editor);
                        if(existReportID == undefined || existReportID == ""){
                            var params = {
                                SessionToken: getSession(),
                                Name: value,
                                Type: report_type,
                                Notes: JSON.stringify(jsonObj1),
                                ReportJSON: JSON.stringify(jsonObj),
                                UserJSON: JSON.stringify(jsonObj2)
                            };
                            call_api_ajax1('WriteReport', 'post', JSON.stringify(params), false, (data) => {
                                if(data.Result.ReportID != undefined){
                                    report_id = data.Result.ReportID;
                                    call_api_ajax1('ReadReport', 'get', {
                                        SessionToken: getSession(),
                                        ReportID: report_id
                                    }, false, (data) => {
                                        parameters = JSON.parse(data.Result.ReportJSON);
                                        report_name = data.Result.Name;
                                        report_locked = data.Result.Locked;
                                        report_type = data.Result.Type;
                                        ShowJSReport(parameters);
                                        
                                        notes_editor.load(data.Result.Notes);
                                        user_editor.load(JSON.parse(data.Result.UserJSON));
                                
                                        requestParameters = JSON.parse(data.Result.ReportJSON);
                                        requestParameters.FrequencyOptions = {
                                            AllowWeekends: 'off'
                                        };
                                        notesParameters = data.Result.Notes;
                                        userParameters = JSON.parse(data.Result.UserJSON);
                                
                                        $('#reportID').text(data.Result.ReportID);
                                        $('#saveReportID').text(data.Result.ReportID);
                                        $('#reportName').text(data.Result.Name);
                                        $('#reportType').text(data.Result.Type);
                                        $('#reportLocked').text(data.Result.Locked);
                                        $('#reportCreated').text(data.Result.Created);
                                        $('#reportUpdated').text(data.Result.Updated);
                                        $('#reportNotes').text(data.Result.Notes);
                                        $('#reportJSON').text(data.Result.ReportJSON);
                                        $('#userJSON').text(data.Result.UserJSON);
                                    });

                                    window.history.pushState("datasetsPage", "report database", "/report_viewer?report_id=" + report_id + "&tab=request&layout=1");
                                }
                            });
                            $('#saveReportWindow').jqxWindow("close");
                        }
                        else{
                            if(report_id == existReportID){
                                dialogWindow("You are about to overwrite a saved server report.<br>Do you want to continue?", 'query', 'confirm', null,
                                    function () {
                                        var locked = $("#reportPadlock").jqxCheckBox("checked");

                                        if(existLocked == true){
                                            call_api_ajax1('UnlockReport', 'get', {SessionToken: getSession(), ReportID: existReportID}, false);
                                        }

                                        var params = {
                                            SessionToken: getSession(),
                                            ReportID: existReportID,
                                            Name: value,
                                            Type: report_type,
                                            Notes: JSON.stringify(jsonObj1),
                                            ReportJSON: JSON.stringify(jsonObj),
                                            UserJSON: JSON.stringify(jsonObj2)
                                        };
                                        call_api_ajax1('WriteReport', 'post', JSON.stringify(params), false);

                                        if(locked == true){
                                            call_api_ajax1('LockReport', 'get', {SessionToken: getSession(), ReportID: existReportID}, false);
                                        }
                                        $('#saveReportWindow').jqxWindow("close");
                                    }, null, null, {
                                        Ok: 'Yes',
                                        Cancel: 'No'
                                    }
                                )
                            }
                            else{
                                dialogWindow("You are about to overwrite a saved server report.<br>Do you want to continue?", 'query', 'confirm', null,
                                    function () {
                                        var locked = $("#reportPadlock").jqxCheckBox("checked");

                                        if(existLocked == true){
                                            call_api_ajax1('UnlockReport', 'get', {SessionToken: getSession(), ReportID: existReportID}, false);
                                        }

                                        var params = {
                                            SessionToken: getSession(),
                                            ReportID: existReportID,
                                            Name: value,
                                            Type: report_type,
                                            Notes: JSON.stringify(jsonObj1),
                                            ReportJSON: JSON.stringify(jsonObj),
                                            UserJSON: JSON.stringify(jsonObj2)
                                        };
                                        call_api_ajax1('WriteReport', 'post', JSON.stringify(params), false);

                                        if(locked == true){
                                            call_api_ajax1('LockReport', 'get', {SessionToken: getSession(), ReportID: existReportID}, false);
                                        }
                                        $('#saveReportWindow').jqxWindow("close");
                                    }, null, null, {
                                        Ok: 'Yes',
                                        Cancel: 'No'
                                    }
                                )
                            }
                        }
                        resizeElements();
                        // updateReportListCombobox();
                    }
                }
            }
        });

        $("#btnCancelReport").jqxButton({
            width: '65px',
            height: '35px',
            textPosition: "center"
        });
        $("#btnCancelReport span").css("left", 13).css("top", 7);

        $("#btnCancelReport").on('click', function () {
            $('#saveReportWindow').jqxWindow('close');
        });

        if(report_locked == true){
            $("#reportPadlock").jqxCheckBox({checked: true});
        }
        else{
            $("#reportPadlock").jqxCheckBox({checked: false});
        }

        $("#createCloneReport").jqxCheckBox({checked: false});

        // $("#createCloneReport").bind('change', function (event) {
        //     var checked = event.args.checked;
        //     if(checked == true){
        //         $("#reportPadlock").jqxCheckBox({disabled: false});
        //         $("#reportsList").jqxComboBox("disabled", false);
        //     }
        //     else{
        //         $("#reportPadlock").jqxCheckBox({disabled: true});
        //         $("#reportsList").jqxComboBox("disabled", true);
        //     }
        // });

        $("#btnRequestSaveJson").jqxButton({
            imgSrc: "resources/css/icons/report-dn.png",
            imgPosition: "left",
            width: 45,
            height: 24,
            imgWidth: 34,
            imgHeight: 16,
            textPosition: "right"
        });
        $("#btnRequestSaveJson").css("border-color", "#ddd").css("box-shadow", "0px 0 2px rgb(0 0 0 / 25%)");
        
        $("#btnRequestSaveJson").on('click', function () {
            var jsonObj = getJsonTree(request_editor);
            var notesObj = getJsonTree(notes_editor);
            var userObj = getJsonTree(user_editor);
            if(jsonObj == undefined || Object.keys(jsonObj).length == 0){
                dialogWindow("No Report data has been loaded.", "error");
            }
            else{
                if(jsonObj != undefined && notesObj != undefined && userObj != undefined){
                    if(jsonObj.Frequency != undefined && jsonObj.Series != undefined){
                        var reportJSON = {
                            ReportJSON: jsonObj,
                            Notes: notesObj,
                            UserJSON: userObj,
                        };
    
                        
                        var link = document.createElement('a');
                        link.href = 'data:text/plain;charset=UTF-8,' + escape(JSON.stringify(reportJSON));
                        link.download = 'request_'+report_name+'.SJR';
                        link.click();
    
                        requestParameters = jsonObj;
                        notesParameters = notesObj;
                        userParameters = userObj;
                    }
                    else{
                        dialogWindow("The selected file cannot be used.<br>It was not created with the 'Save JSON' function", "error");
                    }                
                }
            }
        });

        $("#btnRequestReadJson").jqxButton({
            imgSrc: "resources/css/icons/report-up.png",
            imgPosition: "left",
            width: 45,
            height: 24,
            imgWidth: 34,
            textPosition: "right"
        });
        $("#btnRequestReadJson").css("border-color", "#ddd").css("box-shadow", "0px 0 2px rgb(0 0 0 / 25%)");
        
        $("#btnRequestReadJson").on('click', function () {
            if(getSession() == undefined || getSession() == ""){
                $('body').addClass('overlay');
                $('#loginPopup').jqxWindow('open');
                $('#loginPopup').css('z-index', 999999);
                $('#loginPopup .jqx-window-header div').css("float", "none");
            }
            else{
            // dialogWindow("The report may have been changed.<br/>If you load a new report you my lose these changes.<br>Do you want to lose any changes", "query", "confirm", "Monitor+ - Allow Weekends", () => {
                $('#fileupload').trigger('click');
            // }, null, null, { Ok: "Yes", Cancel: "No" });
            }
        });

        $("#fileupload").change(function(){
            var file_info = $('#fileupload').prop('files');
            var filename = file_info[0].name;
            if(filename.substr(filename.length-3) !== "SJR"){
                dialogWindow("wrong file!");
            }
            else{
                var fr = new FileReader();
                fr.addEventListener('load', (event) => {
                    const result = getJson(event.target.result);
                    if(result != undefined && result.ReportJSON != undefined && result.Notes != undefined && result.UserJSON != undefined){
                        if(result.ReportJSON.Frequency != undefined && result.ReportJSON.Series != undefined){
                            ShowJSReport(result.ReportJSON);
                            notes_editor.load(result.Notes);
                            user_editor.load(result.UserJSON);
                            gridColumndraw();
                            grid.setColumns(columns);
                            CreateAddPreHeaderRow();
                        }
                        else{
                            dialogWindow("The selected file cannot be used. <br/>It was not created  with the 'Save JSON' function", "error");
                        }                        
                    }
                });
                fr.readAsText(file_info[0], 'UTF-8');
            }
        });

        $("#btnRefresh").jqxButton({
            imgSrc: "resources/css/icons/reload.png",
            imgPosition: "left",
            width: 24,
            height: 24,
            textPosition: "right"
        });
        $("#btnRefresh").css("border-color", "#ddd").css("box-shadow", "0px 0 2px rgb(0 0 0 / 25%)");

        $("#btnRefresh").on('click', function () {
            if(getSession() == undefined || getSession() == ""){
                $('body').addClass('overlay');
                $('#loginPopup').jqxWindow('open');
                $('#loginPopup').css('z-index', 999999);
                $('#loginPopup .jqx-window-header div').css("float", "none");
            }
            else{                
                var jsonObj = getJsonTree(request_editor);
                var jsonObj1 = getJsonTree(notes_editor);
                var jsonObj2 = getJsonTree(user_editor);

                if(jsonObj == undefined || Object.keys(jsonObj).length == 0){
                    dialogWindow("No Report data has been loaded.", "error");
                }
                else{
                    if(JSON.stringify(jsonObj) != JSON.stringify(requestParameters) || jsonObj1 != notesParameters || JSON.stringify(jsonObj2) != JSON.stringify(userParameters)){
                        edit_flag = true;
                    }
        
                    if(edit_flag == true){
                        dialogWindow("You are about to refresh a saved report and may lose any changes you have made.<br>Would  you like to  save your changes first?", "query", "confirm", "Monitor+ - Allow Weekends", () => {
                            $('#btnRequestSaveReport').trigger('click');
                        }, () => {
                            $("#jqxLoader").jqxLoader('open');
                            setTimeout(() => {
                                if(jsonObj != undefined){
                                    if(jsonObj.Frequency != undefined && jsonObj.Series != undefined){
                                        ShowJSReport(jsonObj);
                                        gridColumndraw();
                                        grid.setColumns(columns);
                                        CreateAddPreHeaderRow();
                                        $("#jqxLoader").jqxLoader('close');
                                    }
                                    else{
                                        $("#jqxLoader").jqxLoader('close');
                                        dialogWindow("The Request tab must contain valid JSON code.", "error");
                                    }                
                                }
                            }, 100);
                        }, null, { Ok: "Yes", Cancel: "No" });
                    }
                    else{
                        $("#jqxLoader").jqxLoader('open');
                        setTimeout(() => {
                            if(jsonObj != undefined){
                                if(jsonObj.Frequency != undefined && jsonObj.Series != undefined){
                                    ShowJSReport(jsonObj);
                                    gridColumndraw();
                                    grid.setColumns(columns);
                                    CreateAddPreHeaderRow();
                                    $("#jqxLoader").jqxLoader('close');
                                }
                                else{
                                    $("#jqxLoader").jqxLoader('close');
                                    dialogWindow("The selected file cannot be used. <br/>It was not created  with the 'Save JSON' function", "error");
                                }                
                            }
                        }, 100);
                    }
                }
            }
        });
        
        $("#btnResponseSaveJson").jqxButton({
            imgSrc: "resources/css/icons/report-dn.png",
            imgPosition: "left",
            width: 45,
            height: 24,
            imgWidth: 34,
            imgHeight: 16,
            textPosition: "right"
        });
        $("#btnResponseSaveJson").css("border-color", "#ddd").css("box-shadow", "0px 0 2px rgb(0 0 0 / 25%)");
        
        $("#btnResponseSaveJson").on('click', function () {
            var jsonObj = response_json;
            if(jsonObj != undefined){
                var link = document.createElement('a');
                link.href = 'data:text/plain;charset=UTF-8,' + escape(JSON.stringify(jsonObj));
                link.download = 'response_'+report_name+'.JSON';
                link.click();
            }
            else{
                dialogWindow("No Report data has been loaded.", "error");
            }
        });

        $("#btnResponseRefresh").jqxButton({
            imgSrc: "resources/css/icons/reload.png",
            imgPosition: "left",
            width: 24,
            height: 24,
            textPosition: "right"
        });
        $("#btnResponseRefresh").css("border-color", "#ddd").css("box-shadow", "0px 0 2px rgb(0 0 0 / 25%)");

        $("#btnResponseRefresh").on('click', function () {
            if(getSession() == undefined || getSession() == ""){
                $('body').addClass('overlay');
                $('#loginPopup').jqxWindow('open');
                $('#loginPopup').css('z-index', 999999);
                $('#loginPopup .jqx-window-header div').css("float", "none");
            }
            else{
                var jsonObj = getJsonTree(request_editor);
                if(jsonObj == undefined || Object.keys(jsonObj).length == 0){
                    dialogWindow("No Report data has been loaded.", "error");
                }
                else{
                    $("#jqxLoader").jqxLoader('open');
                    setTimeout(() => {
                        if(jsonObj != undefined){
                            if(jsonObj.Frequency != undefined && jsonObj.Series != undefined){
                                ShowJSReport(jsonObj);
                                gridColumndraw();
                                grid.setColumns(columns);
                                CreateAddPreHeaderRow();
                                $("#jqxLoader").jqxLoader('close');
                            }
                            else{
                                $("#jqxLoader").jqxLoader('close');
                                dialogWindow("The selected file cannot be used. <br/>It was not created  with the 'Save JSON' function", "error");
                            }                
                        }
                    }, 100);
                }
            }
        });
    }

    CreateAddRequestHeaderRow();

    function getJsonTree(obj) {
        try {
            return obj.get();
        } catch (ex) {
            if(ex != "Error: SyntaxError: Unexpected end of JSON input"){
                dialogWindow("Wrong JSON Format: " + ex, "error");
                $("#jqxLoader").jqxLoader('close');
            }
            else{
                return {};
            }
        }
    }

    function getJson(txt) {
        try {
            return JSON.parse(txt);
        } catch (ex) {
            alert('Wrong JSON Format: ' + ex);
        }
    }
    
    $('#triangle').click(function () {
        meta_rows = $("#metadataContent").find("div"),
        size = 1.35 * (meta_rows[0].offsetHeight + meta_rows[1].offsetHeight + meta_rows[2].offsetHeight),
        number = $("#metadataContent")[0].offsetHeight;
      
        if (toggleMetaData === 1) {
            this.src = "resources/images/up.png";
            $('#mainSplitter').jqxSplitter({
                panels: [{
                    size: number * 1.1 + "px"
                }]
            });
          
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 10);
          
        } else if (toggleMetaData === -1) {
            this.src = "resources/images/down.png";
            $('#mainSplitter').jqxSplitter({
                panels: [{
                    size: size-4 + "px"
                }]
            });
          
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