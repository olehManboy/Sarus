const API = location.protocol + "//api.idatamedia.org/";
const MAINSITE = location.protocol + "//"+ location.host +"/";
//const SITE_PAGES = ["/profile", "/profilemain", "/seriesviewer", "/mydsviewer", "/MySubscriptions"];
var SITE_PAGES = ["/profile", "/profilemain", "/seriesviewer", "/mydsviewer", "/MySubscriptions", "/report_viewer"];

if(location.host == "myfavorites.sarus.com" )
{
    SITE_PAGES.push("/");
}


function getBaseUrl() {
    return API;
}
function getMainSite()
{
    return MAINSITE;
}
