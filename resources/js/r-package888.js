$(document).ready(function () {

    $(".menu-hide-btn").click(function () {
        $(this).hide()
        $(".r-package-logo").addClass("mt-0")
        $(".left-menu-wrapper").show()
        $(".right-content").addClass("col").removeClass("col-12")
    });
    $(".left-content .left-menu-wrapper i").click(function () {
        $(".r-package-logo").removeClass("mt-0")
        $(".left-content .left-menu-wrapper").hide()
        $(".menu-hide-btn").show()
        $(".right-content").addClass("col-12").removeClass("col")
    });

    // $("#nav").load("header.html")
    // $("#footer").load("footer.html")




});
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
})