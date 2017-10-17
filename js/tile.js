/**
 * Contains a background image and (possibly) an Actor(s) as its contents. It can also be highlighted.
 * The Actor's div floats on top of this tile.
 * This is unique; there is only one Tile with a certain pair of coordinates.
 * There may be multiple actors within this! getContents() or this.contents will return an array!
 * 
 * API:
 * Tile(Coords, String background)
 * String getID() //call $('#' + tile.getID()) to access this tile's table cell
 * void addContents(Actor) //puts contents in tile
 * Actor getContents() //returns null if no contents
 * Actor relinquish() //removes contents and returns them
 * void setHighlight(String cssClass, callback) //highlights tile, calls callback(this tile as param) when clicked
 * void unhighlight() //removes highlighting
 * 
 * Accessible: (instance vars)
 * Coords coords
 * Actor[] contents //or use getContents()
 */

var Tile = new Class({
    
/**
 * Creates a new, empty tile.
 * @param {Coords} coords   the coordinates of this tile.
 * @param {String} background   the type of background this tile has. Pass just the name; the directory will be found later. Must be shorthand - like "g" for "grass". See utils's backgroundConvert object.
 * @param {Flags} flags information to be stored with this tile that others can view.
 */
__init__: function(self, coords, background, flags){
     //strangely, clone() on tiles sometimes creates weird cases in which nothing is passed to this constructor. In this case, exit
     //FIXME get rid of this kludge somehow
     if(!coords) return false;
     
    self.coords = coords;
    self.contents = []; //no contents right now
    self.flags = flags;
    self.highlight = null; //highlight css class
    self.path = null; //cached data stored here; path from some tile to this
    self.associatedTile = null; //cached; tile an actor needs to step onto to access this one
    
    //background shorthand converter will convert later
    self.background = background;
    
    //build td - the table cell contains its bg, the content layer, and the highlight layer
    //bg -> the td's background itself
    //content layer -> absolute on top of td
    //highlight layer -> absolute on top of content layer
    self.td = $('<td></td>');
    self.setBackground(background);
    self.td.attr('id', self.getID());
    
    /*self.contentLayer = $('<div></div>'); //goes on top of td
    self.contentLayer.addClass("content-layer");
    self.td.append(self.contentLayer);*/
    
    self.highlightLayer = $('<div></div>'); //this goes on top of contents
    self.highlightLayer.addClass("highlight-layer");
    self.highlightLayer.hide(); //don't let it show
    self.highlightLayer.css({ //it's absolute, so make it float on top of this
        top: self.coords.getYPixels(),
        left: self.coords.getXPixels()    
    });
    self.td.append(self.highlightLayer);   
},

/**
 * Returns a unique identifier for this tile based on its coordinates.
 * This is registered with the table cell that houses this tile.
 * So, you can find this tile's table cell with $('#' + tile.getID()).
 */
getID: function(self){
    return "t-" + self.coords.x + "-" + self.coords.y;
},

getX: function(self){
    return self.coords.x;
},

getY: function(self){
    return self.coords.y;
},

hasFlag: function(self, flag){
    return self.flags.hasFlag(flag);
},

/**
 * Puts this tile in the DOM view.
 * Adds this tile's table cell to the given DOM parent, and puts the contents (if any) in the proper place. 
 * @param {$tr} parent  the jQuery <tr> element to add this tile to. The contents of this tile will be put in their own location.
 */
addToView: function(self, parent){
    parent.append(self.td);
    //add each content
    self.contents.forEach(function(content){
        $('#actors').append(content.div);
    });
},

/**
 * Updates this tile's background-image.
 * @param {String} background   the type of background this tile has. Pass just the name; the directory will be found later.
 */
setBackground: function(self, background){
    self.background = background;
    self.td.css('background', 'url(images/tiles/' + backgroundConverter[self.background] + '.png)'); //use bg image    
},

/**
 * Returns the SHORTHAND name of the background. use backgroundConverter to find its formal name 
 */
getBackground: function(self){
     return self.background;
},

/**
 * Takes the given Actor and places it in this tile. 
 * 
 * DON'T CALL ME DIRECTLY! Use Actor.putInTile(tile) or putInView.
 * @param {Actor} object   the object to place in this tile. It will be notified that it has been put in.
 */
addContents: function(self,object){
    self.contents.push(object);
    //move the contents to on top of this
    object.div.animate({
        top: self.coords.getYPixels(),
        left: self.coords.getXPixels()    
    });    
},

/**
 * Removes the contents of the tile matching the parameter, (maybe) making it empty again.
 * 
 * DON'T CALL ME directly - use Actor.removeFromTile() or Actor.removeFromView()
 * 
 * @return {Actor} toRemove the actor to remove from the tile.
 */
removeContents: function(self, toRemove){
    self.contents = self.contents.subtract(toRemove);
},

/**
 * Removes any and all actors in the tile. This REMOVES THEM FROM THE VIEW too.
 */
empty: function(self){
     while(self.hasContents()){
          self.contents[0].removeFromView();
     }
},

/**
 * Removes any and all actors in the tile. This DOES NOT REMOVE THEM FROM THE VIEW.
 */
clear: function(self){
     while(self.hasContents()){
          self.contents[0].removeFromTile();
     }     
},

/**
 * Returns the contents of this tile, or null if it's empty.
 */
getContents: function(self){
    return self.contents;
},

hasContents: function(self){
    return self.contents.length > 0;
},

/**
 * Calls the given function for each of this tile's contents.
 * The function will be given the parameter [Actor contents], which is one actor contained in this tile.
 * @param {function(Actor)} func    the function to call on each content. 
 */
forEachContents: function(self, func){
    self.contents.forEach(func);
},

/**
 * Highlights this tile the given color. When clicked, it will call a callback.
 * @param {String} cssClass    a css class to style the tile (should specify a bg color.)
 * @param {function} callback   a function to be called when this tile is clicked. It will be given this tile as a parameter. Use this to do something useful.
 * @param {function} callback2  [optional] another function like callback. This is called after the first callback. Use this to clean up - for example, unhighlight the other tiles.
 */
setHighlight: function(self, cssClass, callback, callback2){
    if(self.highlight)
        self.highlightLayer.removeClass(self.highlight);
    self.highlightLayer.show();
    self.highlightLayer.addClass(cssClass);
    self.highlight = cssClass;
    self.highlightLayer.oneClick(function(){
        callback(self);
        if(callback2) callback2(self);
    })
},

/**
 * Makes this tile unhighlighted (removes the highlighting).
 */
unhighlight: function(self){
    //hide and remove click
    self.highlightLayer.hide();
    self.highlightLayer.unbind('click');
    if(self.highlight)
        self.highlightLayer.removeClass(self.highlight);
    self.highlight = null;
},

setPathTo: function(self, path){
    self.path = path;
},

getPathTo: function(self){
    return self.path;  
},

/**
 * Returns the manhattan distance between this tile and the other. 
 * @param {Tile} other
 */
distanceTo: function(self, other){
    return astar.manhattan(self.coords, other.coords);    
},

/**
 * Returns the ABSOLUTE difference between the coords of this tile and the other.
 * @param {Tile} other
 * @return {Object} structure: {dx: 0, dy: 0}. dx and dy will always be positive
 */
getAbsoluteXYTo: function(self, other){
     return {
          dx: Math.abs(self.getX() - other.getX()),
          dy: Math.abs(self.getY() - other.getY())
     };
},

/**
 * Returns true if this tile matches the other - that is, their coords are equal. 
 * @param {Tile} other
 * @return {boolean}
 */
equals: function(self, other){
    return self.coords.equals(other.coords);
}

});
