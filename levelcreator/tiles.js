/*
 * Designing tiles of the level.
 */

function startTileSelection() {

     $('#tile-menu').empty();

     //set up sidebar
     //for each thing in background converter, add
     var i = 0;
     var TILES_PER_ROW = 4;
     var currentRow = null;
     Object.keys(backgroundConverter, function(key, value) {
          //key = 'g', value = 'grass' and so on
          if (i % TILES_PER_ROW == 0) {
               //new row; dump current contents of row into table and reset it
               if (currentRow) {
                    $('#tile-menu').append(currentRow);
               }
               currentRow = $('<div></div>');
               currentRow.addClass('row-fluid').addClass('tile-menu-row');
          }
          //tile html
          var tile = getClonedTemplate("tile-template");
          tile.find('img').attr('src', sprintf('images/tiles/%s.png', value))//e.g. grass.png
          .attr('title', value);
          tile.oneClick(function(event) {
               if (event.which == 1) {
                    //left button, make it active (primary)
                    //remove all other highlights, make this one active
                    $('.tile-menu-cell').removeClass('active-tile');
                    $(this).addClass('active-tile');
                    setActiveBackground(key);
               } else if (event.which == 2) {
                    //middle button, make it alternative
                    //remove all other highlights, make this one alt
                    $('.tile-menu-cell').removeClass('alt-tile');
                    $(this).addClass('alt-tile');
                    setAlternativeBackground(key);
               }
               return false;
          });
          /*tile.longClick(function(){
           //make it the tile set's background image
           tileset.setBackground(key);
           });*/
          currentRow.append(tile);
          i++;

          //at the end, dump the final row in
          if (i == Object.keys(backgroundConverter).length) {
               $('#tile-menu').append(currentRow);
          }
     });

     //add bootstrap tooltips to stuff
     $('.tile-menu-cell>img').tooltip();
     $('#rightbar img').tooltip();

     //handle events
     tileset.initTileEvents(function(tile) {
          tile.td.oneClick(function(event) {
               //set the bg to the active bg
               if (event.which == 1)
                    tile.setBackground(activeBackground);
               else if (event.which == 2)
                    tile.setBackground(altBackground);
          });
          tile.td.mouseover(function(event) {//moused IN
               if (isPressed('apply-hover')) {
                    //dragging is enabled, set the background
                    if (event.which == 1)
                         tile.setBackground(activeBackground);
                    else if (event.which == 2)
                         tile.setBackground(altBackground);

               }
               return false;
          });
     });
}

/**
 * Sets the background type of the tiles that will be placed now.
 * @param {String} backgroundAbbrev     the abbreviation of the background, e.g. 'g' for grass.
 */
function setActiveBackground(backgroundAbbrev) {
     activeBackground = backgroundAbbrev;
}

function setAlternativeBackground(backgroundAbbrev) {
     altBackground = backgroundAbbrev;
}