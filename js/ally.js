var Ally = new Class({
    
__extends__: Animal,   

__init__: function(self, type, name, level, teamName, optionalAttrs){
     teamName = orDefault(teamName, TEAM_NAMES.ALLIES);
    Class.ancestor(Ally, '__init__', self, type, name, level, {
         attack:    "success", 
         loseHP:    "bad-damage",
         die:       "error"
      }, DIALOGUE_TYPES.ally, teamName, optionalAttrs);
    
    self.experience = 0;
    self.skillPoints = self.level; //if they join your team at a higher level, they should come with some skill points built in; even the main char gets one to start
    self.active = true;
    self.selectingTile = false; //true if in the process of choosing a tile (level.requestTile was called)
     
     //reg then dereg to activate only the ones that are OK for non-turn use (like seeing popover)
    self.registerClicks();
    self.deregisterClicks();
    //self.div.css('background-image', 'url(images/backgrounds/ally-background.png)');
},

/*
 * Binds events to the clicking of this ally's div.
 */
registerClicks: function(self){
    //select tile to move onto/attack
    /*
    self.div.oneClick(self.selectTiles);
    self.div.longClick(self.showActionDialog, LONG_CLICK_DURATION);  
    */
    /*
    self.eventLayer.off('click');
    self.eventLayer.off('touchstart');
    self.eventLayer.off('mousedown');
    
    self.eventLayer.on('click', function(){ log('click'); });  
    self.eventLayer.on('touchstart', function(){ log('touchstart'); });  
    self.eventLayer.on('mousedown', function(){ log('mousedown'); });  
   */ 
   
    self.eventLayer.oneBind('mousedown.select', self.selectTiles);
    //self.eventLayer.oneBind('mousedown.popover', self.showPopover);
    //self.eventLayer.longClick(self.showActionDialog, LONG_CLICK_DURATION); 
    //self.eventLayer.longClick(self.showPopover, LONG_CLICK_DURATION); 
    
    self.eventLayer.longClick(self.showInfoDialog, LONG_CLICK_DURATION);
    
    /*
    self.div.off('mousedown touchstart click');
    self.div.oneBind("click ", self.selectTiles);
    self.div.longClick(self.showActionDialog, LONG_CLICK_DURATION); 
    */   
    
    //console.log("REG");  
},


/**
 * Stops clicks that would cause the ally to do something... keeps the important ones (seeing stats) around
 */
deregisterClicks: function(self){
     self.eventLayer.off('mousedown.select'); 
     //BUT still show popover 
     
     //console.log("DEREG");
     //console.trace();
},

/**
 * Handles clicking: getting ready to select a tile, or canceling if we're already selecting. 
 */
selectTiles: function(self){
 
   //log('selecting');
     
   if(self.selectingTile){
       //they are currently selecting; re-clicking means to cancel
       self.stopSelecting();
       return;
   }
   var level = world.getLevel();
   
   //move tiles
   var tiles = level.getMoveTiles(self);
   level.requestTile(tiles, "move-highlight", function(tile){
       //when a tile is clicked...
       self.moveOnPath(tile);
       //self.moveTo(tile, true); //final stop, should interact
       self.selectingTile = false;
   });
   
   //attack tiles
   //ask each move tile which other tiles are within range; add those to attack list
   var attackTiles = level.getAttackTiles(self, tiles);
   
   level.requestTile(attackTiles, "attack-highlight", function(tile){
       //when a tile is clicked...
       //can we even interact at this distance (or at all)? only carry on if there's something legit there
       var shouldContinue = false;
       for(var i=0; i<tile.contents.length; i++){
           if(self.canInteractAtDistance(tile.contents[i])) shouldContinue = true;
       }
       
       if(shouldContinue){             
           //let's interact with whatever's in tile
           //if necessary, move toward the tile
           //necessary when it's not in attack range; you have to move there and THEN interact
           self.suppressAutoEndTurn();
           if(tile.distanceTo(self.tile) > self.range && tile.associatedTile){
               //we set this when finding tiles adjacent to move tiles
               //there IS a tile we need to step over to get to this one
               self.moveOnPath(tile.associatedTile);
           }
           tile.forEachContents(function(content){
               self.interact(content);    
           });
       }
       
       self.selectingTile = false;
   });
   
   self.selectingTile = true;
},

/**
 * Ends the user's selecting of a tile: clears highlights, etc. 
 */
stopSelecting: function(self){
     if(self.selectingTile){
       world.getLevel().clearHighlights();
       self.selectingTile = false;    
       } 
},

/**
 * Adds ally-specific stuff to the info dialog.
 * @param {jQuery} modal the modal (dialog) whose contents you can change around. 
 */
extendInfoDialog: function(self, modal){
   //show ally-only stuff
   modal.find('.ally-only').show();
   
   //ADD ACTION BUTTONS
   //empty out buttons, install new ones
   var buttonContainer = $('#action-buttons');
   buttonContainer.empty();
   
   //got an invokable ability?
   if(self.ability instanceof InvokableAbility){
       var button = getClonedTemplate('action-button-template');
       button.find('.action-name').html(self.ability.name);
       button.find('.action-desc').html(self.ability.description);
       if(self.abilityUses >= self.getMaxAbilityUses()){
           //used up
           button.find('.action-uses').html('0');
           button.attr('disabled', 'disabled');
       }
       else{
           var usesLeft = self.getMaxAbilityUses() - self.abilityUses;
           button.find('.action-uses').html(usesLeft);
           //button.find('.action-name').('Use (' + usesLeft + ' left this level)');
           
           button.oneClick(function(){
               self.useAbility();    
           });
       }
       buttonContainer.append(button);
   }        
   
   //hook up to skip buttons etc
   $('#animal-skip-turn').oneClick(function(){
        self.tryFinishing();
   });
},

/**
 * Handles the long clicking: open the action dialog to show what you can do.
 */
showActionDialog: function(self){

   //open dialog w/ possible actions
   //fill it in
   $('#action-dialog-char-name').html(self.name);
   
   //empty out buttons, install new ones
   var buttonContainer = $('#action-buttons');
   buttonContainer.empty();
   
   //got an invokable ability?
   if(self.ability instanceof InvokableAbility){
       var button = getClonedTemplate('action-button-template');
       button.find('.action-name').html(self.ability.name);
       button.find('.action-desc').html(self.ability.description);
       if(self.abilityUses >= self.getMaxAbilityUses()){
           //used up
           button.find('.action-uses').html('0');
           button.attr('disabled', 'disabled');
       }
       else{
           var usesLeft = self.getMaxAbilityUses() - self.abilityUses;
           button.find('.action-uses').html(usesLeft);
           //button.find('.action-name').('Use (' + usesLeft + ' left this level)');
           
           button.oneClick(function(){
               self.useAbility();    
           });
       }
       buttonContainer.append(button);
   }        
   //TODO: add a btn for each action. when they click it, ask for tiles matching that criteria
   /*self.actions.forEach(function(action){
       //add a new button
       var button = getClonedTemplate('action-button-template');
       button.html(action.name);
       button.click(function(){ 
           //ask for    
       });        
   });*/
   
   //pop it open
   $('#action-dialog').modal('show');
},

/**
 * Resets any temporary vars from last level and deals w/ any re-initialization.
 */
resetForLevel: function(self){    
   //self.registerClicks(); //tile selection etc
   self.initQtip();    
     
   self.selectingTile = false;
   if(self.ability instanceof InvokableAbility)
     self.abilityUses = 0;
   //reset stat changes
   self.clearStatChanges();
   self.afflictions = [];
   self.mergeInAbility(); //overwrites any temporary ability vars     
},

//overriding stuff from Animal
/**
 * Called when this animal is done with its turn. 
 */
onFinish: function(self){
     //stop it from moving again only if there are enemies/other folks around
     if(!level.isOneSided())
          self.deregisterClicks();
     self.stopSelecting();
     Class.ancestor(Ally, 'onFinish', self);
},

/**
 * Called whe this animal's TEAM is beginning a new turn. 
 */
onTeamTurnStart: function(self){
     self.registerClicks();
     Class.ancestor(Ally, 'onTeamTurnStart', self);   
},

/**
 * Called once this animal's TEAM is finished with their turn and the other guys get to go.
 */
onTeamTurnEnd: function(self){
     self.deregisterClicks();
     Class.ancestor(Ally, 'onTeamTurnEnd', self);
},

getClass: function(self){ return "Ally"; },

canInteractWith: function(self, responder){
    //anything that says it can be interacted with, we can interact with - no restrictions
    return true;    
},

chooseAction: function(self, actions, target){
    //ask user for the action to choose
    self.useAction(actions[1], target);    
},

/**
 * Called after this ally damages a foe. This ally gains a little experience and possibly levels up.
 * @param {Enemy} defender  The enemy has lost HP and may be dead.
 * @param {int} damageDone  how much damage you did to them.
 */
onAfterAttack: function(self, defender, damageDone){
    //gain a little experience for hitting them
    //diff = your level - their level; - means you're weaker, + means you're stronger
    var diff = self.level - defender.level;
    var magicPlus = 0.60; //experience times this for each successive level; you're stronger
    var magicMinus = 1.15; //experience times this for each successive level; you're weaker
    var experience;
    if(diff > 0){
        experience = BASE_ATTACK_EXPERIENCE * Math.pow(magicPlus, diff);
    }
    else{
        experience = BASE_ATTACK_EXPERIENCE * Math.pow(magicMinus, -diff);
    }
    
    //cap experience
    experience = confine(experience, 0, MAX_ATTACK_EXPERIENCE);
    
    self.gainExperience(experience);
},

/**
 * Called after this ally kills a foe. This ally gains a lot of experience.
 * @param {Enemy} defender  the enemy you killed.
 */
foeDefeated: function(self, defender){
    //diff = your level - their level; - means you're weaker, + means you're stronger
    //exp: diff+: base*^x, diff-: base*1.25^-x
    var diff = self.level - defender.level;
    var magicPlus = 0.70; //experience times this for each successive level; you're stronger
    var magicMinus = 1.20; //experience times this for each successive level; you're weaker
    var experience;
    if(diff > 0){
         //you're stronger
        experience = BASE_KILL_EXPERIENCE * Math.pow(magicPlus, diff);
    }
    else{
        experience = BASE_KILL_EXPERIENCE * Math.pow(magicMinus, -diff);
    }

    //cap experience
    experience = confine(experience, 0, MAX_KILL_EXPERIENCE);
    
    self.gainExperience(experience);
},

/**
 * Called when this ally is killed by a foe.
 * @param {Enemy} attacker  the enemy that killed you. 
 */
defeated: function(self, attacker){
     
     log(self.name + " was defeated!", self.themes.die);
     level.removeActor(self);
    //<TODO>: implement
},

/**
 * Gain a certain amount of experience, and possibly level up.
 */
gainExperience: function(self, amount){
     //can't gain experience when you're at max level
     if(self.level == MAX_LEVEL){
          self.experience = 0;
          return false;
     }
     
    self.experience += amount;
    //log(sprintf("%s gained %d experience!", self.name, amount), 'warning');
    //gain levels?
    while(self.experience >= EXPERIENCE_PER_LEVEL){
        self.experience -= EXPERIENCE_PER_LEVEL;
        self.levelUp();
    }
},

/**
 * Gain a level.
 * @param {int}     times     [optional, default 1] how many levels to gain. Mostly for testing purposes.
 */
levelUp: function(self, times){
     times = orDefault(times, 1);
     var before = [ self.getAttack(true), self.getDefense(true), self.getMaxHP() ];
     for(var i=0; i<times; i++){        
          //you can't go past max level!
          if(self.level == MAX_LEVEL) return false;
          
         self.level++;
         self.skillPoints++;
    }
    
    //log about the change
    var after = [ self.getAttack(true), self.getDefense(true), self.getMaxHP() ];
    var howManySkillPoints = times == 1 ? "a skill point" : times + " skill points"; //how to say how many points they gained
    log(sprintf('%s grew to level %d, and gained %s!<br />Attack +%s<br />Defense + %s<br />Max HP +%s',
     self.name, self.level,
     howManySkillPoints,
     after[0] - before[0], after[1] - before[1], after[1] - before[1]
    ), 'info');    
    
    self.fullHeal(false);
},

/**
 * OVERRIDDEN FROM ANIMAL
 * Given a choice of actions, choose one (ask user.)
 * Call self.useAction(actionChosen, target) to use the action.
 * THIS SHOULD END THE TURN!
 * @param {Action[]} actions    a list of actions that CAN be used; choose one and use it. There will be 2+, guaranteed.
 * @param {Animal} target   the animal this action will be used against.
 */
chooseAction: function(self, actions, target){
     //load dialog
     var dialog = $('#action-chooser-dialog');
     var buttonArea = $('#action-chooser-buttons');
     buttonArea.empty();
     
     $('#action-chooser-char-name').html(self.name);
     
     self.actions.forEach(function(action){
          //make a button for it
          var button = getClonedTemplate('action-button-template');
          button.find('.action-name').html(action.name);
          button.find('.action-desc').html(action.description);
          button.find('.action-uses-holder').hide(); //unlimited uses for now
          button.oneClick(function(){
               self.useAction(action, target);
               //useAction will handle ending turn
          });  
          buttonArea.append(button);
     });
     //TODO if you cancel the action dialog, make it undo the move
     dialog.on('hidden', function(){
          //well they're not doing anything this turn i guess
          self.allowAutoEndTurn();
          self.tryFinishing();
     })
     
     dialog.modal('show');
},

/**
 * Determines if this ally is playable (active). If it's active, it may be used to battle, move, etc. 
 * @return {boolean}    true if it's active, false if it isn't
 */
isActive: function(self){
    return self.active;
},

/**
 * Makes this ally active, so you can use it to battle, move, etc.
 * Not used in levels, just to see who you can carry around.
 */
activate: function(self){
    self.active = true;
},

/**
 * Makes this ally inactive, so that another ally can take its spot as active ally.
 */
deactivate: function(self){
    self.active = false;
}
 
});
