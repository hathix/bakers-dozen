/**
 * Wrapper around a set of tiles that will eventually make a level.
 */
var TileSet = new Class({
__init__: function(self, background) {

     self.tiles = [[]];
     self.background = background; //short
     self.lastEventFunc = null;
     //default
},

/**
 * Creates the tile array. 
 */
setDimensions: function(self, rows, cols) {
     self.tiles = [[]];
     //reset it
     for (var y = 0; y < rows; y++) {
          self.tiles[y] = [];
          for (var x = 0; x < cols; x++) {
               self.tiles[y][x] = new Tile(new Coords(x, y), self.background);
          }
     }
     
     self.putOnBoard();
}, 

/*
 * Sets the level's BG and the default bg of all new tiles.
 */
setBackground: function(self, background){
     self.background = background;
     self.putOnBoard();
},

/**
 * Sets the bg of all tiles here. 
 */
setAllTileBackgrounds: function(self, background){
     self.forEachTile(function(tile){
          tile.setBackground(background);     
     });
     self.putOnBoard();
},

putOnBoard: function(self) {
     //fill up the $board with our tiles
     var board = $('#board');
     board.empty();
     for (var r = 0; r < self.numRows(); r++) {
          var tr = $('<tr></tr>');
          for (var c = 0; c < self.numCols(); c++) {
               self.tiles[r][c].addToView(tr);
          }
          board.append(tr);
     }

     //fill up the rest of the screen's background
     $('#container').css('background-image', 'url(images/tiles/translucent/' + backgroundConverter[self.background] + '.png)');
     
     if(self.lastEventFunc)
          self.initTileEvents(self.lastEventFunc);
},    

/**
 * Initializes any clicks etc. on the tiles. This gets called whenever the tiles' DOM elements get updated. 
 * Pass a function that accepts a tile object.
 * 
 * If you don't pass a tileFunc, we'll use the last one previously used.
 */
initTileEvents: function(self, tileFunc){
     self.lastEventFunc = tileFunc;
     self.forEachTile(function(tile){ tileFunc(tile); });
},

/**
 * Returns the number of rows in this level's tile grid.
 */
numRows: function(self) {
     return self.tiles.length;
},

/**
 * Returns the number of columns in this level's tile grid.
 */
numCols: function(self) {
     return self.tiles[0].length;
},

/**
 * Returns ALL the tiles in this level in a flat (1D) array. They are in no guaranteed order.
 * @return {Tile[]} the tiles in this level.
 */
getTileList: function(self) {
     return self.tiles.flatten();
},

/**
 * Returns the tile at the given coordinates.
 * @param {Coords} coords   the coordinates to find a tile at, or null if the coords are out of bounds
 */
getTile: function(self, coords) {
     if (self.isInBounds(coords))
          return self.tiles[coords.y][coords.x];
     return null;
},

/**
 * Runs the given function on each of this level's tiles.
 * Have the function return false to exit looping.
 */
forEachTile: function(self, func){
     self.getTileList().each(func);     
},

/**
 * Returns true if the given coords are legally in bounds in this level.
 * That is, there's a tile at the given coords.
 */
isInBounds: function(self, coords) {
     return coords.y >= 0 && coords.y < self.numRows() && coords.x >= 0 && coords.x < self.numCols();
}
});
