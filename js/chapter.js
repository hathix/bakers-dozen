/**
 * A collection of associated level groups bound together with an overworld level.
 */
var Chapter = new Class({

/**
 * 
 * @param {int} number  a unique identifier for the chapter.
 * @param {String} name a name for the chapter.
 * @param {OverworldLevel} overworldLevel   the level that the user will use to move between level groups. Create this and give it now.
 * @param {function} levelGroupDB   see below
 * 
 * LevelGroup levelGroupDB(int number)
 * Provide a level group with the given name.
 * Return just a levelGroup. Other stuff will be done to it by getLevelGroup.
 * Use a switch/case statement to build and return the appropriate group.
 * @param {int} number  the unique identifier for the LevelGroup.
 * @return {LevelGroup} a set of levels. 
 */
__init__: function(self, number, name, overworldLevel, levelGroups){
    self.number = number;
    self.name = name;
    self.overworldLevel = overworldLevel;
    self.levelGroups = levelGroups;
    
    //sort the level group list by id... they specified their own, we just put them in an array in any order
    self.levelGroups = self.levelGroups.sortBy('id');
},

start: function(self){
    //open up overworld level
    self.returnToOverworld();
},

/**
 * Begins the given level group.
 * @param {int/LevelGroup} levelGroup   The level group to start. Or pass the id of the level group and we'll get the level group that matches that id. 
 */
startLevelGroup: function(self, levelGroup){
     if(levelGroup.isInteger()){
          //get the level group that matches it... it's the id
          levelGroup = self.getLevelGroup(levelGroup);
     }
     levelGroup.start(self);
},

/**
 * Called when a levelgroup that belongs to this is finished. 
 */
finishLevelGroup: function(self, levelGroup){
    self.returnToOverworld();    
    self.overworldLevel.enterFrom(levelGroup);
},

returnToOverworld: function(self){
    //reload statuses of all level groups... some may have been finished
    self.levelGroups.each(function(lg){
        lg.updateStatus(self);
    }); 
    
    //open up overworld level
    self.overworldLevel.chapter = self;
    self.overworldLevel.load(); 
},

/**
 * Returns the level group with the given name.
 * In the interest of memory, we don't create the level groups up front, but create them dynamically.
 * They are restored with their save data etc.
 * NOT VIRTUAL.
 * @param {String} name the unique identifier for the LevelGroup.
 * @return {LevelGroup} a set of levels, fully initialized.
 */
getLevelGroup: function(self, id){
    return self.levelGroups[id];
},

});
