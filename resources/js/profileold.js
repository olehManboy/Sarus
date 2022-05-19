function openSeriesInNewTab(database, category, sessionToken)
{   
    dialogWindow("Do you want to view the metadata for category: "+category+"?", 'query', 'confirm', null,
    function()
    {
        window.open('mydsviewer?Datasource='+database+'&Page=1&Category='+category, '_blank')
    },
    null, null, { Ok: 'Yes', Cancel: 'No' });
}

function openNav() {
    if ( $(window).width() < 420 )
        $("#tabs-menu").width('100%');
    else 
        $("#tabs-menu").width(250);

    $("#tabs-menu ul").show();
}

function closeNav() {
    $("#tabs-menu ul").hide();
    $("#tabs-menu").width(0);
}

$( document ).ready(function ()
{
    $("#tabs-menu li").on('click', function () {
        if ( $(window).width() <= 768 ) {
            closeNav();
        }
    });

    $.jqx.utilities.scrollBarSize = 11;

    var sessionToken = getSession(),
    url_tab = getParameterByName('tab'),
    DatasourcePage_active = false,
    userName = '', userRef = '', userCompany = '', userCountry = '', userPhone = '',  userEmail = '',
    userAddress1 = '', userAddress2 = '', userAPIKey = '', userCity = '', userPostCode = '', userInActive = null,
    accessData, available, updateHint, grid, menu, last_API_KEY, userSettings = {};


    // Get user data and check if session is not Expired
    call_api_ajax('GetMyAccountDetails', 'get', { SessionToken: sessionToken }, false, ( data ) =>
    {
        userName     = data.Result.Name;
        userRef      = data.Result.UserReferenceNumber;
        userCompany  = data.Result.Company;
        userCountry  = data.Result.Country;
        userPhone    = data.Result.Phone;
        userEmail    = data.Result.Email;
        userAddress1 = data.Result.Address1;
        userAddress2 = data.Result.Address2;
        userCity     = data.Result.City;
        userAPIKey   = data.Result.APIKey;
        userPostCode = data.Result.PostCode;
        userInActive = data.Result.InactiveAccess;

		$('#username').text( userName );
        $('#tab6 .secTitle > span:first-child').text( userName + '. ' + userCompany );
    });

    call_api_ajax('ReadUserJSONSettings', 'get', { SessionToken: sessionToken }, false, ( data ) =>
    {
        data = data.Result;
        userSettings.id    = parseInt(data.slice(0, 1));
        userSettings.user  = parseInt(data.slice(1, 2));
        userSettings.pass  = parseInt(data.slice(2, 3));
        userSettings.check = parseInt(data.slice(3));
    });

    function createDatasourcePage()
    {
        call_api_ajax('GetUserDatasources', 'get', { SessionToken: sessionToken, ReturnCategoryList: 'true' }, true, ( data ) =>
        {
            data = data.Result;
            if ( data.length <= 10 )
            {
                for ( var i in data )
                {   
                    if ( data[i].CategoryDS )
                    {
                        grid = $('<div style="border-color: transparent;" id="grid'+i+'"></div>');
                        menu = $('<div id="jqxdropdownbutton'+i+'"></div>');
                        accessData = '<div class="idm-access"><i><img src="/resources/css/icons/Folder16.png" alt=""></i> Categories: <span>'+ data[i].DetailsDS.UserCategoryCount +'/'+ data[i].DetailsDS.CategoryCount +'</span><span class="online-bt sm-btn"></span></div>';
                        available  = '<p> Updated: '+ data[i].Updated.split('T').join(' ').split('Z').join(' ') + '</p></div>';
                        updateHint = '';
                    }
                    else {
                        accessData = '<div class="idm-access"><i><img src="/resources/css/icons/Key16.png" alt=""></i> Access: <span>'+ data[i].Details.AccessStartDate +' to '+ data[i].Details.AccessEndDate +'</span></div>';
                        available  = '<p> Available: '+ data[i].Details.AccessStartDate + ' to ' + data[i].Details.AccessEndDate + '</p></div>';
                        updateHint = 'title=" Updated: '+ data[i].Updated.split('T').join(' ').split('Z').join(' ') + '"';
                    }

                    var items = $('<div class="col-sm-6 idm-box mr">'   +
                                '<div class="idm-box-inner">'			+
                                '<div class="idm-box-inner-heading">'	+
                                '<div class="idm-box-logo">'			+
                                '<img src="'+ data[i].Icon.split('http:').join(location.protocol) +'" alt="">' +
                                '</div><div class="idm-box-heading"><h2>' +
                                '<a href="/mydsviewer?Datasource=' + data[i].Datasource + '" target="_blank">'+ data[i].Name +'</a>' +
                                '</h2><span>Datasource: <strong><a id="sourceName" href="/mydsviewer?Datasource=' + data[i].Datasource +'" target="_blank">' + data[i].Datasource + '</a></strong></span>' +
                                '</div></div><div class="idm-mid-part">' +
                                '<p class="equal-height">'+ data[i].Description +'</p>' +
                                '<div class="dis-block clearfix"><div class="idm-date"><i>' +
                                '<img src="/resources/idm-service/resources/images/date-icon.jpg" '+updateHint+' alt=""></i>' + available +
                                '<div class="idm-series">Series: <span>'+ data[i].SeriesCount +'</span></div>' + accessData +
                                '</div><div class="idm-inner-footer"><span class="premium-bt pull-left">' +
                                '</span> <span class="online-bt pull-right"><a href="/mydsviewer?Datasource=' + data[i].Datasource + '" target="_blank">View Details</a></span>' +
                                '</div></div><div class="clearfix"></div></div></div>');

                    $( items ).appendTo('.idm-database-block > .row');
                    if ( data[i].CategoryDS )
                    {
                        $( items ).css('background-color', '#e6fbec').find('.online-bt a').css({"background": "#6eb343", "color": "#fff"});
                        $('.sm-btn').append( menu );
                        menu.append( grid );
                        
                        var left = $( grid ).offset().left,
                        top = $( grid ).offset().top,
                        p_w = $('.main-content').outerWidth(),
                        p_h = $('.main-content').outerHeight(),
                        p_l = $('.main-content').offset().left,
                        p_t = $('.main-content').offset().top,
                        width  = p_l + p_w - left,
                        height = p_t + p_h - top;

                        menu.jqxDropDownButton({
                            width: 50, height: 20
                        });

                        var dropDownContent = "<img src='resources/css/icons/smViewDD.png' style='width: 50px; height: 20px;margin-left: -3px;' />";
                        menu.jqxDropDownButton('setContent', dropDownContent);

                        let source = {
                            localdata: [],
                            datatype: "array",
                            datafields: [
                                { name: 'Name', type: 'string' },
                                { name: 'Description', type: 'string' },
                                { name: 'StartDate', type: 'date' },
                                { name: 'EndDate', type: 'date' },
                                { name: 'AccessStartDate', type: 'date' },
                                { name: 'AccessEndDate', type: 'date' },
                                { name: 'SeriesCount', type: 'int' },
                                { name: 'AccessType', type: 'string' },
                                { name: 'InactiveAccess', type: 'boolean' }
                            ]
                        };

                        let dataAdapter = new $.jqx.dataAdapter(source, {
                            loadComplete: function (data) { },
                            loadError: function (xhr, status, error) { }      
                        });
                        
                        source.localdata = data[i].DetailsDS.Categories;
                        
                        var pagerrenderer = function ()
                        {
                            var element = $("<div style='margin-left: 10px; margin-top: 11px; width: 100%; height: 100%;'></div>");
                            var datainfo = $("#grid"+i).jqxGrid('getdatainformation');
                            var paginginfo = datainfo.paginginformation;
                            var leftButton = $("<div style='padding: 0px; float: left;'><div style='margin-left: 9px; width: 16px; height: 16px;'></div></div>");
                            leftButton.find('div').addClass('jqx-icon-arrow-left');
                            leftButton.width(36);

                            var rightButton = $("<div style='padding: 0px; margin: 0px 3px; float: left;'><div style='margin-left: 9px; width: 16px; height: 16px;'></div></div>");
                            rightButton.find('div').addClass('jqx-icon-arrow-right');
                            rightButton.width(36);

                            leftButton.appendTo(element);
                            rightButton.appendTo(element);
                            var label = $("<div style='font-size: 11px; margin: 2px 3px; margin-top:-2px; font-weight: bold; float: left;'></div>");
                            label.text("1-" + paginginfo.pagesize + ' of ' + datainfo.rowscount);
                            label.appendTo(element);
                            self.label = label;
                            // update buttons states.
                            var handleStates = function (event, button, className, add) {
                                button.on(event, function () {
                                    if (add == true) {
                                        button.find('div').addClass(className);
                                    }
                                    else button.find('div').removeClass(className);
                                });
                            }
                            rightButton.click(function () {
                                grid.jqxGrid('gotonextpage');
                            });
                            leftButton.click(function () {
                                grid.jqxGrid('gotoprevpage');
                            });
                            return element;
                        }
                        
                        grid.on('pagechanged', function () {
                            var datainfo = grid.jqxGrid('getdatainformation');
                            var paginginfo = datainfo.paginginformation;
                            self.label.text(1 + paginginfo.pagenum * paginginfo.pagesize + "-" + Math.min(datainfo.rowscount, (paginginfo.pagenum + 1) * paginginfo.pagesize) + ' of ' + datainfo.rowscount);
                        });

                        var symbol_renderer = function (row, datafield, value, html, columnproperties, record) 
                        {
                            return '<div class="jqx-grid-cell-left-align" id="vCenter" ><a target="_blank" onclick="openSeriesInNewTab(\'' + data[i].Datasource + '\',\'' + value + '\',\'' + sessionToken + '\');">' + value + '</a></div>';
                        }

                        var inactiveAccess_renderer = function (row, datafield, value) 
                        {
                            if (value) return '<div class="inactiveRenderer"><img id="startIcon" height="17" width="17" src="resources/css/icons/confirm24.png"></div>';
                            else return '<div class="inactiveRenderer"><img id="startIcon" height="17" width="17" src="resources/css/icons/cancel_AI.png"></div>';
                        }

                        var cellclassname = function (row, column, value, data) {
                            if ( isDateExpired( data.AccessEndDate, true ) )
                                return 'redClass';
                        }

                        grid.jqxGrid(
                        {
                            width: width - 5,
                            source: dataAdapter,
                            pageable: false,
                            height: height,
                            columnsresize: true,
                            theme: 'light',
                            pagerrenderer: pagerrenderer,
                            columns: [
                                { text: 'Name', align: 'center', datafield: 'Name', width: 100, filtertype: 'string', cellsrenderer: symbol_renderer },
                                { text: 'Description', align: 'center', datafield: 'Description', filtertype: 'string' },
                                { text: 'Count', align: 'center', datafield: 'SeriesCount', width: 100, filtertype: 'number', cellsalign: 'center' },
                                { text: 'From', align: 'center', datafield: 'AccessStartDate', width: 100, cellsalign: 'center', filtertype: 'range', cellsformat: 'yyyy-MM-dd' },
                                { text: 'To', align: 'center', datafield: 'AccessEndDate', width: 100, cellsalign: 'center', filtertype: 'range', cellsformat: 'yyyy-MM-dd', cellclassname: cellclassname },
                                { text: 'Access', align: 'center', datafield: 'AccessType', width: 100, filtertype: 'string', cellsalign: 'center' },
                                { text: 'Start Date', align: 'center', datafield: 'StartDate', minwidth: 75, width: 200, cellsalign: 'center', filtertype: 'range', cellsformat: 'yyyy-MM-dd' },
                                { text: 'End Date', align: 'center', datafield: 'EndDate', width: 120, cellsalign: 'center', filtertype: 'range', cellsformat: 'yyyy-MM-dd' },
                                { text: 'I.A.', align: 'center', datafield: 'InactiveAccess', width: 100, filtertype: 'boolean', cellsalign: 'center', cellsrenderer: inactiveAccess_renderer }
                            ],
                            ready: function()
                            {
                                grid.jqxGrid('autoresizecolumns');
                            }
                        });

                        var rows = grid.jqxGrid('getrows');
                        var count = rows.length;
                        if (count > 50) {
                            grid.jqxGrid({ pageable: true, pagesize: 50 });
                        }

                        // initialize jqxGrid
                        grid.on('rowselect', function (event) {
                            var args = event.args;
                            var row = grid.jqxGrid('getrowdata', args.rowindex);
                        });
                    }
                }
            }
            else window.location.href = "/MySubscriptions";

            DatasourcePage_active = true;
        });
    }


    var boxes = document.getElementsByClassName("col-sm-6 idm-box");

    for (var i=0; i<boxes.length-1; i++)
    {
        for (var j=i+1; j<boxes.length; j++)
        {
            if (boxes[i].innerHTML.indexOf("top-right-ribbon") === -1 && boxes[j].innerHTML.indexOf("top-right-ribbon") !== -1)
            {
                var t = boxes[i].outerHTML;
                boxes[i].outerHTML = boxes[j].outerHTML;
                boxes[j].outerHTML = t;
            }
            if (boxes[i].innerHTML.indexOf("top-right-ribbon") !== -1 && boxes[j].innerHTML.indexOf("top-right-ribbon") === -1)
            {
                // ne menjaj im mesta
            }
            else
            {
                var nameI = boxes[i].getElementsByClassName("idm-box-heading")[0].getElementsByTagName("a")[0].innerHTML;
                var nameJ = boxes[j].getElementsByClassName("idm-box-heading")[0].getElementsByTagName("a")[0].innerHTML;
                if (nameJ < nameI)
                {
                    var t = boxes[i].outerHTML;
                    boxes[i].outerHTML = boxes[j].outerHTML;
                    boxes[j].outerHTML = t;
                }
            }
        }
    }

    var cont = $(".row");
    var str = "";
    for ( var i=0; i < boxes.length; i++) 
    {
        if (i % 2 == 0) boxes[i].classList.add("mr");
        str += boxes[i].outerHTML;
    }
    cont.html( str );

    if ( url_tab !== "" )
    {
        if ( url_tab == "MySubscriptions" ) createDatasourcePage();

        if ( $('#tabs-menu li[data-tab="'+ url_tab +'"]').length > 0 )
        {
            $('#tabs-menu li, .page').removeClass('active');
            $('#tabs-menu li[data-tab="'+ url_tab +'"]').addClass('active');
            $( '#' + $('#tabs-menu li[data-tab="'+ url_tab +'"]').attr('data-page') ).addClass('active');
        }
        else {
            window.history.pushState('profile', 'profile', 'profile?tab=MyProfile');
        }
    }
    else {
        window.history.pushState('profile', 'profile', 'profile?tab=MyProfile');
    }

    $('#tabs-menu li').click(function ()
    {
        var id = $( this ).attr('data-page');
        if ( $(this).attr('data-tab') == "MySubscriptions" && !DatasourcePage_active )
        {
            createDatasourcePage();
        }

        $('#tabs-menu li').removeClass('active');
        $('.page.active').removeClass('active');
        $( this ).addClass('active');
        $('#' + id ).addClass('active');
        window.history.pushState('profile', 'profile', 'profile?tab='+$(this).attr('data-tab'));
    });

    $('#profile').attr('href', '/profile?tab=MyProfile');
    $('#favorites').attr('href', '/profilemain?tab=favorites');
    $('#logout').click( function () {
        logout();
    });
    $('#listViewer').tooltip();

    $('#newAPIKey').click(function () {
        openRequestNewApiKeyDialog();
    });

    var get_time = function( currentTime )
    {
        let time = currentTime / 1000,
        min = parseInt( time / 60 ),
        seconds = parseInt( time % 60 );

        min = ( min < 10 ) ? "0" + min : min;
        seconds = ( seconds < 10 ) ? "0" + seconds : seconds;

        return min + ":" + seconds; 
    }

    var curTime = 0, sessionTime;

    call_api_ajax('SessionTokenExpires', 'get', { SessionToken: getSession() }, false, ( data ) =>
    {
        curTime = data.Result.Remaining;
        $("#remaining-token").text( get_time( curTime ) );
    });

    var sessionTimeFunc = () =>
    {
        sessionTime = setInterval(() => {

            if ( curTime - 1000 >= 0 )
            {
                curTime -= 1000;
                $("#remaining-token").text( get_time( curTime ) );
            }
            else {
                $("#remaining-token").text('00:00');
                $('#session-token').html('&nbsp;');
                last_API_KEY = $('#apiKey').val();
                $('#apiKey, #newPassword, #confrimPassword').val('');
                $("#newPassword").prop('disabled', true);
                $('#confrimPassword').prop('disabled', true);
                $('#generatedPass').prop('disabled', true);
                $('#btnSaveUserPassword').prop('disabled', true);
                $('#newAPIKey').prop('disabled', true);
                setSession("");
                
                bc.postMessage({
                    path: 'profile',
                    active: 0,
                    SessionToken: ""
                });

                clearInterval( sessionTime );
            }
        }, 1000);
    }

    $('#session-token').text( sessionToken );

    sessionTimeFunc();
    
    $('.rememberSettings').find('td.prop-value input[name="id"]').prop('checked', userSettings.id);
    $('.rememberSettings').find('td.prop-value input[name="username"]').prop('checked', userSettings.user);
    $('.rememberSettings').find('td.prop-value input[name="password"]').prop('checked', userSettings.pass);
    $('.rememberSettings').find('td.prop-value input[name="checkbox"]').prop('checked', userSettings.check);

    $('[data-toggle="popover"]').popover();
    
    $("#btnSaveUserPassword").click(function(event) {
        event.preventDefault();
        var newPassword = $("#newPassword").val();
        var confirmPassword = $("#confrimPassword").val();
        if ( newPassword == '' && confirmPassword=='')
       	{
        	apprise("The password is blank. Please enter (and confirm) a new valid password.",null,()=>
        	{
        		$("#newPassword").focus();
        	});            	
                return;
        }

        if (newPassword == null || newPassword === '' || confirmPassword !== newPassword) 
        {
	    apprise("The values in 'New Password' and 'Confirm Password' do not match. Please check and try again.",null,()=>{
	    	$("#confrimPassword").focus();
	    });
        }
        
        dialogWindow("Save the new password?", 'query', 'confirm', 'Change my password', submitFormPassword, () => {
            $("#newPassword").val('');
            $('#confrimPassword').val('');
        });
    });

    $('#saveSettings').click(function () {
        var settings = "";
        $('.rememberSettings').find('td.prop-value input').each(function()
        {
            settings += $( this ).is(':checked') ? "1" : "0";
        });

        call_api_ajax("WriteUserJSONSettings", "post", JSON.stringify({ SessionToken: sessionToken, Data: settings }), true, () =>
        {
            $('.rememberSettings').find('td.prop-value input').each(function()
            {
                setCookie('remember-' + $( this ).attr('name'), $( this ).is(':checked') ? 1 : 0 );
            });
            dialogWindow("Settings saved successfully", "information");
        });
    });
    
    function openRequestNewApiKeyDialog() {
        var msg = "Changing the API Key may cause problems for other applications that use the API to get market data." +
        "<br><br>Are you sure that you want to change the API Key?"
        dialogWindow(msg, 'warning', 'confirm', 'Change your API Key', generateNewAPIKey);
    }
    
    function submitFormPassword()
    {
        var newPassword = $("#newPassword").val();
            
        let = parameters = {
            SessionToken: sessionToken,
            NewPassword : newPassword
        };
        
        call_api_ajax('ChangeUserPassword', 'get', parameters, true, () =>
        {
            dialogWindow('Password was changed successfully', 'information');
            $("#newPassword").val('');
            $('#confrimPassword').val('');
        });
    }

    function fillCustomerInformation()
    {
        $(".reference > span").html( userRef );
        $("#name").html( userName );

        var address = userAddress1;
            
        if ( userAddress2 != null && userAddress2 != '' )
            address += '<p>' + userAddress2 + '</p>';
            
        if ( userCity != null && userCity != '' )
            address += '<p>' + userCity + '</p>';
            
        if ( userCountry != null && userCountry != '' )
            address += '<p>' + userCountry + '</p>';
            
        if ( userPostCode != null && userPostCode != '' )
            address += '<p>' + userPostCode + '</p>';
            
        $("#address").html( address );
        $("#company").html( userCompany );
        $("#country").html( userCountry );

        var phoneNumber = ( userPhone !== undefined ) ? userPhone : ""; 
        $("#phone").text( phoneNumber );
        $("#email").text( userEmail );

        $("#username").text( userName );
        $("#apiKey").val( userAPIKey );
    }

    bc.addEventListener("message", e => {
        if ( e.data.path == "profile" )
        {
            if ( e.data.active )
            {
                clearInterval( sessionTime );
                sessionToken = e.data.SessionToken;
                $("#apiKey").val( last_API_KEY );
                $("#newPassword").prop('disabled', false);
                $('#confrimPassword').prop('disabled', false);
                $('#generatedPass').prop('disabled', false);
                $('#btnSaveUserPassword').prop('disabled', false);
                $('#newAPIKey').prop('disabled', false);
                $('#session-token').html( e.data.SessionToken );
                curTime = 1800000;
                sessionTimeFunc();
            }
            else {
                curTime = 0;
                clearInterval( sessionTime );
                $("#remaining-token").text('00:00');
                $('#session-token').html('&nbsp;');
                last_API_KEY = $("#apiKey").val();
                $('#apiKey, #newPassword, #confrimPassword').val('');
                $("#newPassword").prop('disabled', true);
                $('#confrimPassword').prop('disabled', true);
                $('#generatedPass').prop('disabled', true);
                $('#btnSaveUserPassword').prop('disabled', true);
                $('#newAPIKey').prop('disabled', true);
            }
        }
    });

    $('#deleteSession').click(function ()
    {
        let sessionToken = getSession();
        if ( sessionToken !== "" && sessionToken !== null && sessionToken !== undefined )
        {
            dialogWindow('Do you want to clear the current session token?', 'query', 'confirm', null, () =>
            {
                call_api_ajax('RevokeSessionToken', 'get', { SessionToken: sessionToken }, true, () =>
                {
                    setSession("");
                    clearInterval( sessionTime );
                    $("#remaining-token").text('00:00');
                    $('#session-token').html('&nbsp;');
                    last_API_KEY = $("#apiKey").val();
                    $('#apiKey, #confrimPassword, #newPassword').val('');
                    $("#newPassword").prop('disabled', true);
                    $('#confrimPassword').prop('disabled', true);
                    $('#generatedPass').prop('disabled', true);
                    $('#btnSaveUserPassword').prop('disabled', true);
                    $('#newAPIKey').prop('disabled', true);

                    bc.postMessage({
                        path: 'profile',
                        active: 0,
                        SessionToken: ""
                    });
                    
                }, () => {
                    return false;
                }, () => {
                    clearInterval( sessionTime );
                });
            }, null, null, { Ok: 'Yes', Cancel: 'No' });
        }
        else {
            dialogWindow('The token is already blank', 'error');
        }
    });

    $('#generatedPass:not(:disabled)').click(function()
    {
        call_api_ajax('GenerateMyPassPhraseJSON', 'get', { words: 4 }, true, ( data ) =>
        {
            $('#newPassword').val( data.Result );
        });
    });
    
    $('#newSession').click(function ()
    {
        sessionToken = getSession();
        if ( sessionToken !== "" && sessionToken !== null && sessionToken !== undefined )
        {
            dialogWindow('Do you want to create a new session token?', 'query', 'confirm', null, () =>
            {
                call_api_ajax('GetSessionToken', 'get', { APIKey: userAPIKey }, true, ( data ) =>
                {
                    curTime = data.Result.TimeLeftMs;
                    setSession( data.Result.SessionToken );
                    $('#session-token').text( data.Result.SessionToken );
                    bc.postMessage({
                        path: 'profile',
                        active: 1,
                        SessionToken: data.Result.SessionToken
                    });
                    sessionTimeFunc();
                }, null, () => {
                    clearInterval( sessionTime );
                });
            },
            null, null, { Ok: 'Yes', Cancel: 'No' });
        }
        else {
            dialogWindow('The token is blank so you will be logged out shortly.<br>Do you want to login again to get a new token?', 'query', 'confirm', null, () => {
                window.location.href = '/login';
            }, null, null, { Ok: 'Yes', Cancel: 'No' });
        }
    });

    $('#refreshSessionToken').click(function ()
    {
        sessionToken = getSession();
        if ( sessionToken !== "" && sessionToken !== null && sessionToken !== undefined )
        {
            dialogWindow('Do you want to restore the session token to full life?', 'query', 'confirm', null, () =>
            {
                call_api_ajax('RenewSessionToken', 'get', { SessionToken: sessionToken }, true, ( data ) =>
                {
                    curTime = data.Result.TimeLeftMs;
                    bc.postMessage({
                        path: 'profile',
                        active: 1,
                        SessionToken: data.Result.SessionToken
                    });

                }, () => {
                    dialogWindow('The token is blank so you will be logged out shortly.<br>Do you want to login again to get a new token?', 'query', 'confirm', null, () => {
                        window.location.href = '/login';
                    }, null, null, { Ok: 'Yes', Cancel: 'No' });
                    return false;
                });
            },
            null, null, { Ok: 'Yes', Cancel: 'No' });
        }
        else {
            dialogWindow('The token is blank so you will be logged out shortly.<br>Do you want to login again to get a new token?', 'query', 'confirm', null, () => {
                window.location.href = '/login';
            }, null, null, { Ok: 'Yes', Cancel: 'No' });
        }
    });

    function generateNewAPIKey()
    {
        call_api_ajax('RequestNewAPIKey', 'get', { SessionToken: getSession() }, false, ( data ) =>
        {
            $("#apiKey").val( data.Result.APIKey );
            dialogWindow("The API Key has now changed. Please use this new key when requesting data from the API.", "information");
        });
    }

    $('#copyAPIKey').click(function () {
        copyToClipboard( $('#apiKey').val() );
    });

    $(".fa-eye-slash").mouseup(function(){
        $("#apiKey").attr("type", "password");
    });

    $(".fa-eye-slash").mousedown(function(){
        $("#apiKey").attr("type", "text");
    });

    if( userInActive == true) {
        $("#contactInformation").show();
        fillCustomerInformation();
    } else {
        $("#errorMsgBlock").show();
    }
});