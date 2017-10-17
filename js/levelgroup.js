/**
 * Contains a static group of related levels. Each level can load another level in the level group. 
 */
var LevelGroup = new Class({

/**
 * @param {int[]} prerequisites     an array of level group indices. In order for this level to be unlocked, all the mentioned level groups must be completed (so don't mention towns.) Pass an empty array if this should be unlocked by default. 
 */
__init__: function(self, id, name, type, prerequisites, levelGenFuncs){
    self.id = id;
    self.name = name;
    self.type = type;
    self.prerequisites = prerequisites;
    
    self.status = LevelGroupEnums.statuses.OPEN; 
    if(self.type == LevelGroupEnums.types.TOWN) self.status = LevelGroupEnums.statuses.TOWN;
    self.currentLevel = null;
    self.chapter = null;
    
    self.levels = null;
    self.levelGenFuncs = levelGenFuncs;
},

/**
 * Begins this level group, loading its first level. 
 * @param {Chapter} chapter the chapter that this level group is going to go in.
 */
start: function(self, chapter){
    self.chapter = chapter;
    levelGroup = self; //GLOBAL
    
    //load our levels into memory
    self.levels = self.levelGenFuncs.map(function(func){
        return func();    
    }); //call each one; store in levels array
    
    //update stage nums of each level to match their actual order
    for(var i=0; i<self.levels.length; i++){
        self.levels[i].stageNumber = i;
    }
    
    //full heal all allies
    world.allies.forEach(function(ally){
     ally.fullHeal();     
    });
    
    //load our first level
    self.loadLevel(LevelTypes.FIRST);   
},

/**
 * Called when another levelgroup has been finished; this way we can update the locked-ness or not 
 */
updateStatus: function(self, chapter){
    if(!self.chapter) self.chapter = chapter;
    
    //locked or not?
    var oldStatus = self.status;
    
    var locked = false;
    self.prerequisites.forEach(function(lgIndex){
        var levelGroup = self.chapter.getLevelGroup(lgIndex);
        if(levelGroup.status != LevelGroupEnums.statuses.COMPLETED)
            locked = true;
    });      
        
    if(oldStatus == LevelGroupEnums.statuses.LOCKED && !locked){
        //this was locked, but now all the obstacles are out of the way. it's open!
        self.status = LevelGroupEnums.statuses.OPEN;
    }
    if(oldStatus == LevelGroupEnums.statuses.OPEN && locked){
        //by default these level groups are open... it should be locked
        self.status = LevelGroupEnums.statuses.LOCKED;
    }
    //we'll know if it's town or completed. they won't be affected
},

/**
 * Begins the level with the given stage number (ID). This handles GUI and all.
 * Pass LevelTypes.EXIT to quit this level group and return to the overworld.
 * Otherwise, the specified level will be loaded.
 * @param {int/string} stageNumber  an int with the static stage number to go to (not recommended), or a string containing a relative direction ("+1" goes forward one stage number, "-1" goes backward; "+2" and so on work too)
 */
loadLevel: function(self, stageNumber){
    //figure out current stage number (from current number)
    var currentStageNumber;
    //if the current level's on, end it
    if(self.currentLevel){
        currentStageNumber = self.currentLevel.stageNumber;
        self.currentLevel.end();
    }
    else{
        //no level; load the first
        currentStageNumber = LevelTypes.FIRST;
    }
    
    //stageNumber may have been passed as a string (relative direction)... parse it
    if(typeof stageNumber == "string"){ //<TODO>: get sugar to work and use stageNumber.isString()
        //char 1: + or -
        //char 2 (last): jump (forward or back)
        var relativeJump = stageNumber.last().toNumber();
        if(stageNumber.startsWith("+")){
            //go forward 
            stageNumber = currentStageNumber + relativeJump;
        }
        else{
            //go back
            stageNumber = currentStageNumber - relativeJump;
        }
    }
        
    //go to it
    //if they said to adv and this is the last level, we'll assume they meant to leave
    if(stageNumber == LevelTypes.EXIT || stageNumber >= self.levels.length){
        //end the level group, return to overworld
        //if this was open, make it complete; leave towns/already complete alone; locked you can't access anyway
        if(self.status == LevelGroupEnums.statuses.OPEN)
            self.status = LevelGroupEnums.statuses.COMPLETED;
        self.chapter.finishLevelGroup(self);
    }
    else{
        //go to the specified level
        self.levels.each(function(level){
            if(level.stageNumber == stageNumber){
                //found it!
                self.currentLevel = level;
                level.load(self);  
                return false;
            }
        });
    }
}

    
});
