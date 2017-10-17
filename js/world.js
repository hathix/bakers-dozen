/**
 * EXTENSIBLE
 * A world that contains the majority of the objects the game uses.
 * This provides default implementation for the adventure game, but you can extend it and override some methods.
 * For example, you can use a different World for minigames or human v human games.
 * 
 * Accessible:
 *  Ally[] allies
 *  Chapter[] chapters
 */
var World = new Class({

/**
 * Creates and loads this world. The global "world" now refers to this.
 */
__init__: function(self, options){
    var defaultOptions = {
     logTurns: false, //whether or not to log the start/end of turns    
    };
    self.options = Object.merge(defaultOptions, options, true, true); //it is deep, and 2nd thing (passed options) override defaults
     
    self.chapters = [];
    self.inventory = []; //list of user's items'
    self.chapter = null; //active chapter
    self.level = null;
    self.allies = null;
    self.difficulty = DIFFICULTIES.EASY;
    //load teams
    
    world = self; //global
},

/**
 * Starts off a new game at the first level. Call this if the user wants to begin a new game. 
 */
newGame: function(self){
    TeamDB.loadDefault();
    
    //default allies
    self.allies = [ new Ally("Elephant","hathix", 1), new Ally("Crab", "Brave", 3) ];
    //load global
    character = self.allies[0];
    
    var chapter = chapterList.get(0);
    self.chapter = chapter;
    chapter.start();
    
    self.enemyLevelCache = [];
},

load: function(self){
    
},

save: function(self){
    
},

/**
 * Ends the old level the user was on and starts a new one 
 */
setLevel: function(self, newLevel){
    //end old level, start new one
    if(self.level) self.level.end();
    self.level = newLevel;
    level = newLevel; //global
    
    //get rid of the cache since the allies' levels may have changed
    self.enemyLevelCache = [];
},

getLevel: function(self){
    return level;
},

/**
 * Returns the active allies (those who can be played.)
 * @return {Ally[]} a list of active allies. Their length is no more than MAX_ACTIVE_ALLIES.
 */
getActiveAllies: function(self){
    var active = [];
    for(var i=0; i<self.allies.length && i<MAX_ACTIVE_ALLIES; i++){
        if(self.allies[i].isActive())
            active.push(self.allies[i]);
    }   
    
    return active;
},

/**
 * Generates 1 level for an enemy based on the allies' current levels and the difficulty.
 * @return {int}    a level for an enemy. 
 */
calculateEnemyLevel: function(self){
     //if we've got something in the cache, serve that up
     if(!self.enemyLevelCache.isEmpty()){
          return self.enemyLevelCache.pop();     
     }
     
     //TODO if ally levels change, wipe the cache and re-build it
     
     //cache is empty!
     //levels will be centered around allies' MAX level, with some bias.
     //TODO consider making it use the average... but then having a lv20 and lv1 person makes level way too easy (lv11 enemies)
     var maxAllyLevel = level.allies.map('level').max(); //ONLY use the enemies animals actually in the level
     var averageEnemyLevel = maxAllyLevel + self.difficulty.levelBias; //add/sub some levels based on how hard you're playing
     
     var levels = normalVariation(averageEnemyLevel, MAX_ENEMY_LEVEL_DEVIATION, 1, 100); //step=1, choose 100 levels for our cache
     //ensure they're in range
     levels = levels.map(function(level){
          return confine(level, MIN_LEVEL, MAX_LEVEL);
     });
     self.enemyLevelCache = levels;
     return self.enemyLevelCache.pop(); //get 1st thing off array
},

//inventory

/**
 * Returns the item with the given name in the inventory, otherwise null if there isn't one. 
 */
getItemByName: function(self, name){
    for(var i=0; i<self.inventory.length; i++){
        if(self.inventory[i].name == name) return self.inventory[i];
    }
    return null;
},

/**
 * Adds the given item to the inventory.
 * Pass the name of the item to have that item created. 
 * @param {Item/String} the item to add, or its name.
 */
addToInventory: function(self, item){
     if(!item) return; //null or undef
    if(Object.isString(item))
        item = new Item(item);
    self.inventory.push(item);
    
    //show alert showing what you got
    $('#item-dialog-name').html(item.description);
    $('#item-dialog-image').attr('src', item.getPictureURL());
    $('#item-dialog').modal();
    
    //add to view
    $('#items-list').append(item.getDisplayDiv());
},

/**
 * Removes the given item from the inventory.
 * Pass the name of the item to remove the item with the given name.
 * @param {Item/String} item    the item itself, or its name to find it.
 * @return {boolean} true if item existed, false if it wasn't found 
 */
removeFromInventory: function(self, item){
    if(Object.isString(item)){
        //string, it's a name
        //find item with that name
        item = self.getItemByName(item);
        if(item == null) return false;
        //otherwise go on removing
    }
    
    self.inventory = self.inventory.subtract(item);
    
    //remove from view
    item.getDisplayDiv().remove();
    
    return true;
},

/**
 * Determines if the user has the given item, or the item with the given name.
 * @param {Item/String} item    the item to check for if you know it; else the name of the item
 * @return {boolean} true if we have it, false otherwise
 */
hasInInventory: function(self, item){
    if(Object.isString(item)){
        //string, it's a name
        //find item with that name
        item = self.getItemByName(item);
        if(item == null) return false;
        //otherwise go on checking
    }
    //just an item, check for it
    return self.inventory.indexOf(item) != -1;
},

});
