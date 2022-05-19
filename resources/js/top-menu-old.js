$( document ).ready(function ()
{
    $(".dropdown").click(            
        function( event ) {
            event.stopPropagation();
            $('> ul.dropdown-menu', this).stop( true, true ).fadeToggle("fast");
            $(this).toggleClass('open');
            $('b', this).toggleClass("caret caret-up");                
        }
    );
	
	function toggleChevron(e) {
        $(e.target)
            .prev('.panel-heading')
            .find("i.indicator")
            .toggleClass('glyphicon-triangle-bottom glyphicon-triangle-right');
    }

    $('#accordion').on('hidden.bs.collapse', toggleChevron);
    $('#accordion').on('shown.bs.collapse', toggleChevron);

    $('.accordion').on('show', function (e) {
        $(e.target).prev('.accordion-heading').find('.accordion-toggle').addClass('active');
    });
    
    $('.panel-collapse').on('show.bs.collapse', function () {
        $(this).siblings('.panel-heading').addClass('active');
    });

    $('.panel-collapse').on('hide.bs.collapse', function () {
        $(this).siblings('.panel-heading').removeClass('active');
    });
});
