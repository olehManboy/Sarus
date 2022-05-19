$( document ).ready(function()
{
    var sessionToken = getParameterByName('SessionToken');
    console.log(sessionToken);
    if ( sessionToken !== "" )
    {
        window.location.href = 'profilemain?tab=favorites';
    }
    else {
        $('.fixpage').show();
    }
    
    var session = getSession();
    if ( session !== null && session !== "" && session !== undefined )
    {
        call_api_ajax('SessionTokenExpires', 'get', { SessionToken : session }, false, () =>
        {
            // Get user data and check if session is not Expired
            call_api_ajax('GetMyAccountDetails', 'get', { SessionToken: session }, true, ( data ) =>
            {
                username = data.Result.Name;
                $('#username').text( username );
                $('#profile').attr('href', 'profile?tab=MyProfile');
                $('#favorites').attr('href', 'profilemain?tab=favorites');
                $('#logout').click( function () {
                    logout();
                });
                $('.non-login').hide();
                $('.home-menu').show();
            },
            () => {
                return false;
            }, null, false);
        },
        () => {
                $('.home-menu').hide();
                $('.non-login').show();
                return false;
        }, null, false);
    }
    else {
        $('.home-menu').hide();
    }

    /*
    $('body').ihavecookies({
        title: '&#x1F36A; Accept Cookies & Privacy Policy?',
        message: 'There are no cookies used on this site, but if there were this message could be customised to provide more details. Click the <strong>accept</strong> button below to see the optional callback in action...',
        delay: 600,
        expires: 1,
        link: 'cookie-policy',
        onAccept: function(){
            var myPreferences = $.fn.ihavecookies.cookie();
            console.log('Yay! The following preferences were saved...');
            console.log(myPreferences);
        },
        uncheckBoxes: true,
        acceptBtnLabel: 'Accept Cookies',
        moreInfoLabel: 'More information'
    });

    if ($.fn.ihavecookies.preference('marketing') === true) {
        console.log('This should run because marketing is accepted.');
    }*/


    
});