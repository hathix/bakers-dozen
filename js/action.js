/**
 * An Action is a move you can use against other animals - your friends or foes.
 * It encapsulates a function that will be called when activated.
 */
var Action = new Class({
  //<TODO>: figure out how priority/AI should work.  
/**
 * Creates an Action.
 * @param {String} name the official name of the action.
 * @param {String} description  longer, more descriptive text of the action.
 * @param {String} targetType   which type of animal this action can be used against; use TARGET_TYPES.friend or TARGET_TYPES.foe.
 * @param {int} priority    may be used to intelligently determine which action to choose.
 *  +ve #   will ALWAYS be chosen instead of melee attack - use when melee attack should NEVER be used.
 *  -ve #   
 * if the user can use multiple actions and must intelligently pick one, the action with the highest priority MAY BE chosen. High priority -> preferred, low priority -> last choice. Melee attack has priority 0; -ve # -> optional, +ve # -> new default choice (to be used instead of melee). Extremer the number, more likely it is to be chosen/not chosen.
 * @param {function(Animal user, Animal target) : void} activate a function called when this action is activated - whether intelligently or manually. The second param, Animal target, is the animal you must act on (may be yourself.)
 * @param {function(Animal user, Animal target) : boolean} shouldUse  a function that will be called if the animal needs to determine intelligently whether or not to use this action on the target. Return a boolean - true to use it (activate() will be called), or false to not use it.
 * @param {function(Animal user, Animal target) : boolean} canUse     [optional; anyone adjacent is default] pass this to custom decide if an animal is a good target. When you click on an animal to use action on, this function will be called to determine if they're an OK target. DON'T BOTHER CHECKING IF THEY'RE THE RIGHT TARGET TYPE - we'll check that ourselves.
 */    
__init__: function(self, name, description, targetType, priority, activate, shouldUse, canUse){
    self.name = name;
    self.description = description;
    self.targetType = targetType;
    
    //raw functions!
    self.activate = activate;
    self.shouldUse = shouldUse;
    self._canUse = orDefault(canUse, function(user, target){
     return user.tile.distanceTo(target.tile) <= user.range;
    });
},

/**
 * Returns true if this action can be used on the given target. Checks for custom action functions & right team. 
 * @param {Animal} viewer     the animal trying to do the action.
 * @param {Animal} target     the animal the viewer is trying to do the action on.
 * @return {boolean}     true if it's OK to use on that target, false otherwise
 */
canBeUsed: function(self, viewer, target){
     //ensure they're right type - foe or friend
     return((viewer.isFriendOf(target) && self.targetType == TARGET_TYPES.friend)||
          (!viewer.isFriendOf(target) && self.targetType == TARGET_TYPES.foe)) &&
          self._canUse(viewer,target);
}
       
});
