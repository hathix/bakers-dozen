/**
 * Handles ONLY the starting code (initialization, etc.) Should have no dependencies.
 */

//basic initialization (load libraries etc)
Cobra.install(); //so we can call Class etc without prepending w/Cobra

/**
 * Handle setting up game and all. 
 */
function main(){
   
   //init interface
   initClicks();
   //initDragouts();
   initDialogs();
   
   var scroll = function(){
    scrollToCenter($('#all'));
    //scrollToCenter($('#dialogue'), null, false, true);
    
    //NEEDED TO PREVENT all from overlapping navbar... causes its own probs (unrounded corners, popups go behind this, etc)
    //this and the line in CSS
    //$('.navbar').css('width', $(window).width());
   };
    
    //when the window is resized, move the board to the center again
    $(window).resize(function(){
        scroll();
    });
    

    world = new World({ logTurns: true });
    world.newGame();
    
    //TEMP - for testing
    /*
    for(var i=0; i<2; i++)
        level.exit();
        */
    enemy = level.enemies[0]; //global
    
   //finish up init
   scroll();    
}

$(document).ready(main);
