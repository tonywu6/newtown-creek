$(document).ready(() => {
    $('[data-fancybox="photo-gallery"]').fancybox({
        loop: true,
        transitionDuration: 250,
        afterLoad : (instance, current) => {
            var pixelRatio = window.devicePixelRatio || 1;
    
            if ( pixelRatio > 1.5 ) {
                current.width  = current.width  / pixelRatio;
                current.height = current.height / pixelRatio;
            }
        }
    });
})
