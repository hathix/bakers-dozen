var OverworldLevel = new Class({
__extends__: Level,

/**
 * 
 * @param {Tile[][]} rawTiles   same as usual. Include 'Overworld Flag' steppables (the "data" is the id of the level group the flag links to)
 * @param {Coords} allyLocation just one Coords (not in an array!)
 * @param {String} background   same as usual
 * @param {function() : Conversation} startingConversationFn   same as usual; probably won't use it
 */
__init__: function(self, rawTiles, allyLocation, background, startingConversationFn){
   Class.ancestor(OverworldLevel, '__init__', self, 0, rawTiles, [allyLocation], background, null, startingConversationFn);
   
   self.chapter = null;
   
   //TODO: have something in exits for going to next chapter
},

setChapter: function(self, chapter){
    self.chapter = chapter;    
},

/*
 * Override - heal all allies when the overworld starts
 */
onStart: function(self){
     world.allies.forEach(function(ally){
          ally.fullHeal();
     });
},

/**
 * Call this if you just finished a level group. This will put you right outside the entrance to it.
 */
enterFrom: function(self, levelGroup){
    //get index of it, and look up which tile leads to it
    var exitNumber = levelGroup.id;
    //find the tile that has the overworld flag that has that exit
    var tiles = self.getTileList();
    var entranceTile = null;
    tiles.each(function(tile){
        tile.forEachContents(function(actor){
            //check if this actor is an overworld thing whose exit (data) = exit number
            if(actor.type.startsWith("Overworld") && actor.data == exitNumber){
                entranceTile = tile;
            }
        });
    });
    
    if(entranceTile){
        //move to that tile
        character.moveTo(entranceTile, false); //don't interact
    }
},

//OVERRIDES

loadAllies: function(self){
    //grab just the main character
    return [character]; //or world.allies[0]
}, 


/**
 * Exit this level and open a level group.
 */
exit: function(self, exitIndex){
    exitIndex = orDefault(exitIndex, 0);
    var levelGroupNum = exitIndex;
    //go to that level group
    self.chapter.startLevelGroup(levelGroupNum);
},

});
