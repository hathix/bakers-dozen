var Item = new Class({

__extends__: Actor,

/**
 * 
 * @param {String} type what type of item this is.
 * @param {Object} data [optional] any data that might be used later, when stepped on. The type and use varies based on what the step function says.
 * @param {Object} optionalAttrs    [optional]
 */
__init__: function(self, type, data, optionalAttrs){
    Class.ancestor(self, '__init__', self, type, type, "items", DIALOGUE_TYPES.sign, optionalAttrs);
    
    self.data = data;
    
    //merge in custom stuff from the database
    var cobrafied = cobraWrap(self, itemDB[type]);
    $.extend(self, cobrafied);
    
    //view stuff
    //not really a div anymore... oh well
    self.displayDiv = getClonedTemplate('item-display')
        .attr('id', self.getDisplayID());
    self.displayDiv.find('.item-image').attr('src', self.getPictureURL());
    self.displayDiv.find('.item-desc').html(self.description);
    
    //to use, just click it!
    self.choosingUse = false; //are you choosing a tile to use this item on?
    self.displayDiv.click(function(){
        if(self.choosingUse){
            //in process of choosing, turn off highlights
            level.clearHighlights();
            self.choosingUse = false;
            return;
        }
        
        //get a tile (any will do), use
        level.requestTile(level.getTileList(), "item-highlight", function(tile){
            self.use(tile);    
            self.choosingUse = false;
        });
        self.choosingUse = true;
    });
    
    /*//toss button
    button = $('<button></button>').html('Toss');
    button.button();
    button.click(function(){
        //<TODO>: add jQueryUI confirm dialog (pretty it up)
        world.removeFromInventory(self);    
    });
    self.displayDiv.append(button);*/
},

/**
 * Returns the div used to display this item in the image list in the view.
 */
getDisplayDiv: function(self){
    return self.displayDiv;
},

getDisplayID: function(self){
    return 'item-' + self.id;    
},


interactedWith: function(self, actor){
    //pick up   
    world.addToInventory(self);
    //remove from view
    self.removeFromView();
},

use: function(self, tile){
    var returnValue = self.useOn(tile);
    if(returnValue == true){
        //used up, get rid of it
        world.removeFromInventory(self);
        //<TODO>: alert them that it works?
    }
},

/**
 * DEFAULT IMPLEMENTATION! Items will override 
 */
useOn: function(self, tile){ return false; },

/**
 * Utility method. Given a tile, checks to see if any of its contents have the given name.
 * @param {Tile} tile
 * @param {String} actorName
 * @return {boolean} 
 */
tileContainsActor: function(self, tile, actorName){
    for(var i=0; i<tile.contents.length; i++){
        if(tile.contents[i].name == actorName) return true;
    }
    return false;
},

/**
 * Utility method. Given an item's name, checks if the user has it.
 * @param {String} itemName
 * @return {boolean} 
 */
hasItem: function(self, itemName){
    return world.hasInInventory(itemName);
}
    
});


/**
 * Hassle-free database for Items.
 * The code associated with a type will be merged into the main Item object. 
 * See above each type for the requirements for what data is.
 * 
 * Specify:
 * String description:  a short description (alternative to name, which may be ugly)
 * boolean useOn(Tile): called when this is to be used on the given tile. Return true if it's OK to use, false otherwise. If it's used (you return true), it'll disappear.
 * 
 * Don't specify anything if you want the item to be totally unusable on the field.
 */
var itemDB = {
   /* These don't do anything in the field. Data doesn't matter.
    * Only specify description.
    */
    "IceCream Orange":{ description: "Orange Ice Cream" },
    "Gift": { description: "Gift" },
    "Money Bag": { description: "Money Bag"},
     
    /*
     * These DO do something in the field. Data may matter. Use the useOn function.
     */ 
     
    "Pill": { //no data
            description: "Dehydrated Bridge",
            useOn: function(self, tile){
                //tile must have flag "bridgeable"
                if(tile.hasFlag("bridgeable")){
                    tile.setBackground("bn");
                    character.monologue("The pill worked like a charm. The dehydrated bridge is now re-hydrated.");
                    return true;   
                }
                else{
                    character.monologue("Dehydrated bridges don't grow on trees, you know.");
                    return false;
                }
            }
        },        
     
    "Lollipop Mint": { //no data
            description: "Mint Lollipop",
            useOn: function(self, tile){
                //up level of any ally there
                var used = false;
                tile.forEachContents(function(contents){
                    if(contents instanceof Ally){
                        contents.levelUp();
                        contents.monologue("Slightly chewy, but I feel stronger!")
                        used = true;
                    }    
                });
                return used;                  
            }
        },         
     
    "2D Glasses": {
               __data: "name of actor this will work against",
            description: "2D Glasses",
            useOn: function(self, tile){
                //works on contents of tile that have name = data
                var used = false;
                tile.forEachContents(function(contents){
                    if(contents.name == self.data){
                        //remove them, replace with steppable
                        var coords = contents.tile.coords;
                        level.removeActor(contents);
                        
                        //<TODO>: based on what type the actor to replace is, i'll make an image called flat-something (and update below), which is full-contrast, black & a solid color
                        var replace = new Steppable("Flat ###");
                        level.addActor(replace, coords);
                    }    
                });
                
                return used;
            }
        },        
     
    "Heart Full": { //no data
            description: "Full Heart",
            useOn: function(self, tile){
                //heal any ally in there
                var healed = false;
                tile.forEachContents(function(contents){
                    if(contents instanceof Ally){
                        contents.gainHPPercent(100);
                        contents.monologue("I feel like a new, er, animal!")
                        healed = true;
                    }    
                });
                return healed;  
            }
        },         
     /*
    "Template": {
            __data: "description of data you want; remove field if you have no data",
            description: "Description",
            useOn: function(self, tile){
                return true;       
            }
        },    
        */ 
};
