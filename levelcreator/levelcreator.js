//basic initialization (load libraries etc)
Cobra.install(); //so we can call Class etc without prepending w/Cobra

var tileset;
var activeBackground = 'g';
var altBackground = 'w'; //alternative background

function main(){
     tileset = new TileSet('g');
     
     //put some tiles in there
     tileset.setDimensions(10, 10); //rows, cols
     
     $('#tiles-tab').oneBind('shown', function(event){
          startTileSelection();     
     });
     $('#actors-tab').oneBind('shown', function(event){
          startActorSelection();  
     });
     
     
     //start off with tiles
     //startTileSelection();
          
     //ui init
     initClicks();
}

function initClicks(){
     //menu bar... general stuff
     $('#set-background').oneClick(function(){
          tileset.setBackground(activeBackground);     
     });
     $('#set-all').oneClick(function(){
          tileset.setAllTileBackgrounds(activeBackground);     
     });
     
     $('#set-dimensions').oneClick(function(){
          $('#dimensions-dialog').modal('show');
          //fill fields with current values
          $('#input-rows').val(tileset.numRows());
          $('#input-cols').val(tileset.numCols());
     });
     $('#dimensions-done').oneClick(function(){
          //actually set dimensions
          var rows = parseInt($('#input-rows').val());
          var cols = parseInt($('#input-cols').val());
          tileset.setDimensions(rows, cols);
     });
}

/**
 * Returns true if the button with the given ID is pressed, false otherwise.
 * USE TO CHECK FOR OPTIONS. 
 * @param {String} buttonID   the id of the button. Omit the hashtag.
 */
function isPressed(buttonID){
     return $('#' + buttonID).hasClass('active');
}
$(document).ready(main);
