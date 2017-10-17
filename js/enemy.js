var Enemy = new Class({
    
__extends__: Animal,

/**
 * 
 * @param {String} type what type of animal this is.=
 * @param {Object} optionalAttrs    specify one of the following:
 *  String name
 *  float recruitmentChance
 *  Item dropItem
 *  float dropChance
 */
__init__: function(self, type, optionalAttrs){
    //chance to be recruited; optionalAttrs may override
    self.recruitmentChance = 0.2;
    
    self.dropItem = null; //<TODO>: if no drop item is specified, drop a potion etc based on level
    self.dropChance = DEFAULT_DROP_CHANCE;
    
    //calculate level for this enemy, since it's not set in stone
    var level = world.calculateEnemyLevel();
    Class.ancestor(Enemy, '__init__', self, type, type, level, {
         attack:    "error", 
         loseHP:    "good-damage",
         die:       "success"
      }, DIALOGUE_TYPES.enemy, TEAM_NAMES.ENEMIES, optionalAttrs);
        //if we switch to btn, use danger instead of error
    
    //self.div.css('background-image', 'url(images/backgrounds/enemy-background.png)');
    
    //clicks
    //self.div.oneClick(self.showPopover);
    self.eventLayer.longClick(self.showInfoDialog, LONG_CLICK_DURATION);
},

//overriding stuff from animal


getClass: function(self){ return "Enemy"; },

canInteractWith: function(self, responder){
    //only interact with allies and steppables
    return responder instanceof Ally || responder instanceof Steppable;
},

/**
 * Called when this enemy is killed by a foe.
 * @param {Enemy} attacker  the ally that killed you. 
 */
defeated: function(self, attacker){
    //var tile = self.tile; //cache for later (we'll lose it from dying)
    
    log(self.name + " was defeated!", self.themes.die);
    
    level.removeActor(self);
    
     if(pushLuck(self.recruitmentChance)){
         //join the team
         log(self.name + ' wants to join your team!');
     }
     //drop item, if there is one
     //determine if we SHOULD do it (if the chance is fulfilled)
     if(self.dropItem && pushLuck(self.dropChance)){
        //NEW FUNCTIONALITY: add straight to inventory
        world.addToInventory(self.dropItem);
     }
},

/**
 * This enemy dies, disappearing from the view and any lists for good.
 */
die: function(self){
     //TODO get rid of (this is already integrated into defeated())
},

/**
 * OVERRIDDEN FROM ANIMAL
 * Given a choice of actions, choose one automatically.
 * Call self.useAction(actionChosen, target) to use the action.
 * THIS SHOULD END THE TURN!
 * @param {Action[]} actions    a list of actions that CAN be used; choose one and use it. There will be 2+, guaranteed.
 * @param {Animal} target   the animal this action will be used against.
 */
chooseAction: function(self, actions, target){
     //TODO implement algorithm to choose action
     //choose a random one
     self.useAction(actions.sample(), target);
},

});
