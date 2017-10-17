/**
 * Represents an entity in the game, such as an item, NPC, obstacle, or animal.
 * This is abstract but has some important functionality. 
 * 
 * API:
 * Actor(String type, String name, String pictureFolder)
 * void moveTo(Tile) //moves directly to given tile
 * void moveTo(Coords) //finds the tile at the given coords and moves it to there
 * void putInTile(Tile) //puts in given tile - no animations or anything
 * void putInTile(Coords) //finds the tile at the given coords and puts it in there
 * void removeFromTile() //ok if it's not in a tile, will do nothing
 * String getPictureURL()
 * void sendMessage(Object message, Actor recipient) //sends data directly to recipient
 * void interact(Actor other) //interacts with the other - call when one steps on other etc
 * 
 * Accessible:
 *  String type - what species of animal, what kind of item - very specific
 *  String name - only different from type with named animals
 *  Coords coords
 *  $ div (created here)
 *  String id (created here) - uniquely identifies this animal
 *  Tile tile (created later) - the tile this is contained in. The tile contains a reference to this too.
 * 
 * VIRTUAL METHODS:
 *  void receiveMessage(String message, Actor sender)
 *  boolean canInteractWith(Actor responder) //you're trying to interact with another actor
 *  boolean canBeInteractedWith(Actor actor) //the other actor is trying to interact with you
 *  void interactWith(Actor responder) //called when you interact wither another actor
 *  void interactedWith(Actor actor) //called after actor interacts with you
 */
var Actor = new Class({
    
    
/**
 * Creates an Actor. All fields are mandatory.
 * @param {String} type the specific kind of Actor. This is species for animal, type of item for item, etc.
 * @param {String} name generally the same as type, except for named animals.
 * @param {String} pictureFolder    the location inside the images folder to look for this animal's image.
 * @param {Object} dialogueType one of DIALOGUE_TYPES; tells what a dialogue spoken by this actor looks like.
 */
__init__: function(self, type, name, pictureFolder, dialogueType, optionalAttrs){
    self.type = type;
    self.name = name;
    self.pictureFolder = pictureFolder; //inside images folder, which folder to go to for image
    self.dialogueType = dialogueType;
    self.visible = true;
    self.tile = null; //not in level yet
    
    self.id = self.type.toLowerCase().dasherize() + Math.floor(Math.random() * 1000);
    self.div = $('<div></div>');
    self.div.addClass("actor");
    self.div.attr('id', self.id);
    
    //add the image layer to the div
    var image = $('<img />');
    image.attr('src',self.getPictureURL());    
    self.div.append(image);
    self.image = image;
    
    self.eventLayer = $('<div></div>');
    self.eventLayer.addClass('event-layer');
    self.div.append(self.eventLayer);

},

/**
 * Returns the path (URL) of this actor's picture, relative to the index. Includes "images/" folder.
 */
getPictureURL: function(self){
    return "images/" + self.pictureFolder + "/" + self.type.toLowerCase().dasherize() + ".png";
},

/**
 * Changes the type (and possibly name) of this actor. The view is also updated. 
 * DOES NOT WORK FOR ANIMALS!
 */
setType: function(self, type){
    var oldType = self.type;
    self.type = type;
    //if name = type, then the default was used, so update it.
    if(self.name == oldType) self.name = self.type; //else, there was a custom name, so leave it
    
    //update view
    self.image.attr('src', self.getPictureURL());
    
    //<TODO>: make it work for animals by having another method below that animal will override
    //self.updateFromType();
},

/**
 * Either shows or hides the actor's div. If it's hidden, this function shows it; if shown, this hides it.
 * When hidden, it's 
 * Use this to temporarily show/hide (switch visibility) of the actor without permanently doing anything. 
 */
switchVisibility: function(self){
    if(self.visible){
        //hide it
        self.oldTile = self.tile; //stored for later
        self.removeFromView();
        self.visible = false; 
    }    
    else{
        //show it
        self.putInView(self.oldTile); //was stored when removed
        self.visible = true;
        //if anything moved here in our absence, get it out of the way
        self.tile.forEachContents(function(contents){
            if(self.equals(contents) == false){
                contents.scoot();    
            }
        });
    }
},

/**
 * Adds this actor to the DOM view. This should only be done when first creating the actor and putting in a level.
 * (Only call this once.)
 * @param {Tile/Coords} tile    the tile to put the actor in, or the coords of the tile 
 */
putInView: function(self, tile){
    self.putInTile(tile);
    $('#actors').append(self.div);    
    
   //self.editImage();
    self.image.load(function(){
         var width = $(this).width();
         self.image.addClass("image" + width); //so like img32 for a 32x32 image 
    });   
},

/**
 * Removes this actor from the DOM view for good.
 * This should only be done when the level ends or the actor should disappear.
 * (Only call this once.);
 */
removeFromView: function(self){
    self.div.fadeOut(function(){
     self.div.remove();
    });
    self.removeFromTile();
    self.div.tooltip('destroy');

    
},

/**
 * Adds this Actor to the given tile. If you don't know the tile, pass the coords and we'll find it.
 * Use this when putting in the tile for the first time.
 * @param {Tile/Coords} tile    the tile if you know it, else the coordinates of the tile to put it into
 */
putInTile: function(self, tile){
    if(tile instanceof Coords)
        tile = level.getTile(tile);
    tile.addContents(self);
    self.tile = tile;
},

/**
 * Removes this Actor from the tile it inhabits, if any.
 * Use this to remove the object for good from the tile, or just to move it.
 * If this is not in a tile, it's fine (nothing happens).
 */
removeFromTile: function(self){
    if(self.tile){
        self.tile.removeContents(self);
        self.tile = null;
    }
},

/**
 * Moves this to the given tile. If you don't know the tile, pass the coords and we'll find it.
 * This tries to interact with everything inside the tile.
 * EVERY TIME YOU MOVE, NO MATTER WHAT WAY, THIS IS CALLED WHENEVER YOU ENTER A TILE. (whether it's scoot, moveOnPath, moveToward, etc)
 * @param {Tile/Coords} tile    the tile if you know it, else the coordinates of the tile to move it to
 * @param {boolean} interact    true if you want to interact with what's here, if anything. If false, you won't touch anything.
 */
moveTo: function(self, tile, interact){
    if(tile instanceof Coords)
        tile = level.getTile(tile);
        
        
    var oldTile = self.tile;
    //step off later, so that what's in the old tile has time to react       
        
    self.removeFromTile();
    
    self.putInTile(tile);
    if(interact == false) return; //obviously we're not supposed to do anything
    
    //try interacting with whatever's in there
    if(interact == true){
        tile.forEachContents(function(contents){
            //interact?
            self.interact(contents);
        });
    }
    
    //step off any steppables in the current tile
    if(oldTile){
        oldTile.forEachContents(function(contents){
            if(contents instanceof Steppable){
                contents.steppedOff(self);
            }    
        });
    }     
},

/**
 * Better alternative than moveTo(). This lets you move along a path generated by the A* algorithm.
 * Instead of just sliding to the destination, you move one square at a time till you reach end.
 * @param {Tile} tile   the tile to move to. Make sure you've pathfound to it (it's pathTo must be set.)
 */
moveOnPath: function(self, tile){     
    var graphNodes = tile.getPathTo(); //GraphNode[]
    
    var oldTile = self.tile;
    //move to each graph node (a tile) in order but don't touch anything - no interactions
    graphNodes.forEach(function(graphNode){
        var tile = level.getTile(new Coords(graphNode.y, graphNode.x));
        self.moveTo(tile, false);  
    });  
    var newTile = self.tile;
    
    //we haven't interacted with anything... interact with new tile's contents, and step off old one
    
    //interact with the new stuff
    newTile.forEachContents(function(contents){
        //interact?
        self.interact(contents);
    });    
    
    //step off steppables in old tile
    oldTile.forEachContents(function(contents){
        if(contents instanceof Steppable){
            contents.steppedOff(self);
        }    
    });    
},

/**
 * Blindly (no checking) moves a certain distance over. As long as the tile is in bounds, we'll move there. 
 * This does not interact with anything at all!
 */
moveRelatively: function(self, dx, dy){
    var tileTo = level.getTile(new Coords(self.getX() + dx, self.getY() + dy));
    if(tileTo){
        self.moveTo(tileTo, false); //don't touch anything!
    }
},

/**
 * This animal moves out of the way - to the closest unoccupied tile it can find. 
 */
scoot: function(self){
    var tile = level.getClosestEmptyTile(self);
    if(tile)
     self.moveTo(tile, false);
},

/**
 * This actor animates its div so that it moves temporarily onto the other tile, then back.
 * Use this for attack/interaction animations to show an interaction going on.
 * @param {Tile} tile   the tile to animate moving onto. 
 */
animateOnto: function(self, tile){
    if(!tile || self.tile.equals(tile)) return; //same tile, no need to animate cause you wouldn't be going anywhere
    var dx = tile.coords.getXPixels() - self.tile.coords.getXPixels();
    var dy = tile.coords.getYPixels() - self.tile.coords.getYPixels();
    self.div.animate({
        top: '+=' + dy,
        left: '+=' + dx
    }).animate({
        top: '-=' + dy,
        left: '-=' + dx
    });
},

getX: function(self){
    return self.tile.coords.x;
},

getY: function(self){
    return self.tile.coords.y;
},

equals: function(self, other){
    return self.id == other.id;
},

/**
 * Builds and returns a dialogue for this actor based on its characteristics.
 * @param {String} words    what to say.
 * @return {Dialogue} 
 */
dialogue: function(self, words){
    return new Dialogue(self.dialogueType, self.type, self.name, words);
},

/**
 * Convenience function. Says a few dialogues
 * @param {String/String[]} words    the words to say in the dialogue. Pass a String to say one thing. Pass a String[] and each string will be said in its own dialogue.
 */
monologue: function(self, words){
    var dialogues;
    //if they gave list of stuff to say, make several dialogues
    if(Object.isArray(words)){
        var dialogues = [];
        words.forEach(function(word){
            dialogues.push(self.dialogue(word));    
        });
    }
    //otherwise just make it one dialogue
    else{
        dialogues = [ self.dialogue(words) ];
    }
    
    level.startConversation(new Conversation(dialogues));    
},

/**
 * Shows a qTip badge containing text on top of this actor. Use it to quickly show simple data about the actor.
 * @param   {string}    text    the text to show in the badge.
 * @param   {string}    style   [optional] the CSS class for the badge. Default 'tipsy'. Separate any additional ones with spaces. Acceptable values:
 *  plain, light, dark, red, green, blue,
 *  shadow, rounded, youtube, jtools, cluetip, tipped, tipsy
 * @param   {int}   showFor     [optional] how long to show the badge for, in ms. Default 1000ms.
 */
showBadge: function(self, text, style, showFor){
    /*
    style = orDefault(style, 'tipsy');

    self.image.qtip({
        content: {
            text: text
        },
        position: {
            my: 'center',
            at: 'center',
            target: self.image
        },
        show: {
            effect: function(){
                $(this).fadeIn();
            }
        },
        hide: {
            //hide after showFor seconds (default 1000)
            inactive: orDefault(showFor, 1000),
            effect: function(){
                $(this).fadeOut();
                $(this).qtip('destroy');
            }
        },
        style:{
            classes: 'ui-tooltip-badge ui-tooltip-' + style
        }
    });
    
    self.image.qtip('show');*/
   
   self.image.tooltip({
       title: text,
       html: true
   }).tooltip('show');
   //TODO get the tooltip to stop showing up now
   self.div.find('img').tooltip({ title: "" }); //clear it away so it doesn't show again
},

/**
 * Send a direct message to a specific Actor.
 * The recipient will be notified with the message and that you sent it. 
 * @param {Object} message  The message to send to the recipient. It can be any type, but preferably a string.
 * @param {Actor} recipient    the actor to send your message to.
 */
sendMessage: function(self, message, recipient){
    recipient.receiveMessage(message, self);
},

/**
 * VIRTUAL - SUBCLASSES OVERRIDE
 * Called when another actor sends a message to this one.
 * React to the message and notify the sender, if you like.
 * @param {Object} message  the message that was sent. It can be any type, but preferably a string.
 * @param {Actor} sender   the actor that sent the message.
 */
receiveMessage: function(self, message, sender){},

/**
 * Interact with another actor when you directly touch it. CALL THIS.
 * @param {Actor} other    the actor you touched and hence might interact with (depending on what they say.)
 */
interact: function(self, other){
    if(self.id == other.id) return; //can't interact with yourself!
    //will call self.interactWith(), other.interactedWith()
    if(self.canInteractWith(other) && other.canBeInteractedWith(self)){
        //self.animateOnto(other.tile); //don't ALWAYS call it, only in certain cases
        self.interactWith(other);
        other.interactedWith(self);
    }
},
/**
 * VIRTUAL - subclasses override.
 * Determines if the actor can interact with another.
 * @param {Actor} responder an actor you're trying to interact with
 * @return {boolean} true if you can interact, false if you can't 
 */
canInteractWith: function(self, responder){ return true; },

/**
 * VIRTUAL - subclasses override.
 * Called when another actor is trying to interact with you.
 * @param {Actor} actor the actor that's trying to interact
 * @return {boolean} true if they can, false if you want to stop them
 */
canBeInteractedWith: function(self, actor){ return true; },

/**
 * VIRTUAL - SUBCLASSES OVERRIDE.
 * Called when THIS actor actively touches another. (BEFORE the responder is notified.)
 * Manipulate the responder as you like.
 * @param {Actor} responder    what this touched. Do something to it.
 */
interactWith: function(self, responder){},

/**
 * VIRTUAL - SUBCLASSES OVERRIDE.
 * Called when another actor TRIES TO touch/interact with this one.
 * However, this is called AFTER. React to the interaction attempt.
 * @param {Actor} actor    the actor trying to interact with this. Usually an animal.
 */
interactedWith: function(self, actor){},

//NOT USED
/**
 * VIRTUAL - SUBCLASSES OVERRIDE 
 * Called AFTER another actor (actor) touches/interacts with this one.
 * The actor manipulated this, and it may have sent some data back: e.g. that it damaged you for so much HP.
 * React to the response here. You may manipulate the actor.
 * @param {Actor} actor    the actor that interacted with this. Usually an animal.
 * @param {Object} response an int, boolean, string, etc that the actor responded with after interactiong with this. The type varies based on what the actor is.
 */
//afterInteractedWith: function(self, actor, response){}
    
/**
 * VIRTUAL - SUBCLASSES OVERRIDE
 *  Does any beginning-of-level initialization.
 */
initForLevel: function(self){},

/**
 * Called when the level ends and we're about to be removed from it.
 * Use to undo any state changes that shouldn't carry over 
 * @param {Object} self
 */
onLevelEnd: function(self){},
    
});
