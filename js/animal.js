/**
 * ABSTRACT
 * An actor that can move around and interact with others. Enemies and allies.
 * 
 * Virtual (overridden by subclasses):
 * boolean isFriendOf(Actor other)
 * void onAfterAttack(Animal defender, int damageDone)
 * void foeDefeated(Animal defender)
 * void defeated(Animal attacker)
 * 
 * Virtual (overridden by abilities):
 * void updateFields() //use to update any of the animals' fields; called at end of constructor
 * float getAttackMultiplier() //atk stat
 * float getDefenseMultiplier() //atk def
 * void chooseAction(Action[] actions, Animal target) //call self.useAction(actionChosen, target)
 * float getDamageMultiplierAttack(Animal defender, float originalMultiplier)
 * float getDamageMultiplierDefense(Animal attacker, float originalMultiplier)
 * boolean customAttackFunction(Animal defender, int finalDamage) //return true to cancel attack
 * boolean customDefenseFunction(Animal attacker, int finalDamage) //return true to cancel attack
 * int onBeforeDeath(Animal attacker, int damageDone) //return a # to stop death; left with that # of HP
 */
var Animal = new Class({
    
__extends__: Actor,

__init__: function(self, type, name, level, themes, dialogueType, teamName, optionalAttrs){
   Class.ancestor(Animal, '__init__', self, type, name, "animals", dialogueType, optionalAttrs);
   
   
   self.level = level;
   self.stats = statDB.get(type);
   self.terrainCosts = self.stats.terrainCosts; //contains cost #s for each terrain type (tile)
   self.ivs = {attack: calculateIV(), defense: calculateIV(), hp: calculateIV()};
   self.evs = {attack: 0, defense: 0, hp: 0, speed: 0, ability: 0};
   self.currentHP = self.getMaxHP();
   self.teamName = teamName;
   self.team = null; //team will do that
   self.statChanges = [];
   self.afflictions = [];
   
   self.moved = false;
   self.autoEndTurn = true; //whether methods can end this animal's turn. You can disable this for manual control.
   
   self.themes = themes;
   self.popoverTheme = themes.popover;
   
   //defaults (constant); may be overridden
   self.range = 1; //attack range
   self.accuracy = 0.9;
   self.chanceOfCritical = CHANCE_OF_CRITICAL;
   self.criticalDamageMultiplier = CRITICAL_DAMAGE_MULTIPLIER;
   self.fogDispelRadius = 2;
   
   self.actions = [new Action(
    "Melee",
    "The normal attack",
    TARGET_TYPES.foe,
    0,
    function(user, target){ //activate
        user.attack(target);
    },
    function(user, target){ //shouldUse
        return user.canAttack(target);   
    }  
   )];
   
   self.mergeInAbility();
   
   //display stuff
   self.initQtip();
   //self.updateQtip(); //initQtip calls this
   
   self.updateFields(); //if necessary
   

   self.div.addClass('animal');
   
   //add hp bar to bottom of div
   self.hpBar = getClonedTemplate("hpbar-template");
   self.hpBar.find('.hp-bar').css('width','100%');
   self.div.append(self.hpBar);
   
    
    //merge in any optional attributes (easier than manually unpacking)
    if(optionalAttrs){
        $.extend(self, cobraWrap(self, optionalAttrs));
    }   
},



/**
 * Adds in this animal's ability. This will overwrite any existing ability variables so it's great for resetting temporary stuff. 
 */
mergeInAbility: function(self){
   self.ability = self.stats.ability;
   self.ability.mergeIn(self);     
},

/**
 * VIRTUAL - abilities override
 * Update any fields the character currently has. This is called at the end of the constructor.
 * You can change stats, range, etc here.
 */
updateFields: function(self){},

/**
 * Moves using the smartest path toward the given tile.
 * Make sure you've called level.getMoveTiles() first to set path to the tile you want to move to.
 * And make sure this tile is within your speed... level.getMoveTiles() will do that. 
 * @param {boolean} tryFinishing   [optional; default true] if true, finishes turn; pass false to end it yourself later (use self.tryFinishing())
 */
moveOnPath: function(self, tile, tryFinishing){
     tryFinishing = orDefault(tryFinishing, true);
     Class.ancestor(Animal, 'moveOnPath', self, tile);
    
    //try ending turn
    if(tryFinishing)
     self.tryFinishing();         
},

applyStatChange: function(self, statChange){
     //add it, but remove anything w/ the same id (overwrite it)
     //if we go unique, in case of overlap the thing at FRONT gets preference, thing at back gets overwritten
     //so slot this at front
     self.statChanges = self.statChanges.insert(statChange, 0).unique('id');     
},

/**
 * Removes a stat change given its id.
 * @param {String}  id   the id of the statchange. 
 */
removeStatChange: function(self, id){
     self.statChanges = self.statChanges.filter(function(change){
          return change.id != id; //get rid of whatever has the given id; keep anything else
     });
},

clearStatChanges: function(self){
     self.statChanges = [];
},

/**
 * FOR TESTING ONLY.
 * This makes the animal pretty much invincible, good for testing out levels or blowing past enemies.
 */
_godMode: function(self){
     self.applyStatChange(new StatChange("godModeAtk", "attack", "=10001", FOREVER));
     self.applyStatChange(new StatChange("godModeDef", "defense", "=10001", FOREVER));
     self.applyStatChange(new StatChange("godModeSpd", "speed", "=101", FOREVER));
     //TODO help hp too
},

/**
 * Using this animal's stat changes, calculates what the final value of a stat is.
 * @param {String} statName   'attack','defense','speed'
 * @param {int} statValue     the normal, actual stat from getAttack() or such
 * @return {int}    the fixed stat after the changes have been calculated in. 
 */
calcStatChanges: function(self, statName, statValue){
     self.statChanges.forEach(function(sc){
          if(sc.stat == statName){
               statValue = sc.changeStat(statValue);
          }
     });
     return statValue;
},

clearStatChanges: function(self){
     self.statChanges = [];     
},

/**
 * Adds an affliction to this animal.
 * @param {Affliction}   affliction     a status like burnt, asleep, confused, etc. 
 */
afflict: function(self, affliction){
     self.afflictions = self.statChanges.insert(statChange, 0).unique('id'); 
},

/**
 * Returns true if this animal has the affliction with the given id, false otherwise.
 * @param {String} id    use the AFFLICTIONS enum. 
 */
hasAffliction: function(self, id){
     var index = self.afflictions.findIndex(function(affliction){ return affliction.id == id; });
     return index != -1;
},

//overriding from actor
//<TODO>: implement interactWith, interacted (or change the design?)

/**
 * Implementation of the stat algorithm to find the basic, unrounded Attack/Defense/HP stat based on parameters.
 * @param {int} base    the determining number for the stat; 10-100
 * @param {float} iv    the individual values of the animal; ~0.95 - ~1.05
 * @param {int} ev  the effort values earned by leveling up; 0-25
 * @return {float} the stat (unrounded). You can multiply this, round it, etc. with other factors.
 */
getRawStat: function(self, base, iv, ev){
   //b = base, l = level, e = ev, i = iv
   //stat = [b/2 + l(b/10)](1 + e/500)(i)
   var stat = base / 2 + self.level * base / 10;
   stat *= 1 + ev / 125; //possibility: make evs give constant boosts (so that weaker stats get same boost)
   stat *= iv;
   
   return stat;
},

/**
 * Returns the maximum HP of the animal.
 * Because it only makes sense for HP to be in full points, the result is rounded.
 * @return {int} the maximum HP of this animal
 */
getMaxHP: function(self){
    //<TODO>: implement better algorithm (less polarized; not as polarized as Atk is)
    return Math.round(self.getRawStat(self.stats.hp, self.ivs.hp, self.evs.hp));
},

/**
 * Returns the maximum HP of the animal. This doesn't use the normal algorithm - this one is less polarized (low base HP still has good HP, high base HP isn't as great.)
 * Because it only makes sense for HP to be in full points, the result is rounded.
 * @return {int} the maximum HP of this animal
 */
/*getMaxHP: function(self){
    //b = base, l = level, e = ev, i = iv
    //stat = (2l + 4b)(1 + e/500)(i)
    var stat = 2 * self.level + 4 * self.stats.hp;
    stat *= 1 + self.evs.hp / 500; 
    stat *= self.ivs.hp;
    return Math.round(stat);
},*/

/**
 * Returns the whole-number attack of the animal. 
 * @param {boolean} pure    [optional] pass true to ignore any temporary boosts.
 * @return {int} the attack power of the animal.
 */
getAttack: function(self, pure){
    var rawStat = self.getRawStat(self.stats.attack, self.ivs.attack, self.evs.attack);
    if(!pure)
     rawStat = self.calcStatChanges('attack', rawStat);
    return Math.round(rawStat);
},

/**
 * Returns the whole-number defense of the animal. 
 * @param {boolean} pure    [optional] pass true to ignore any temporary boosts.
 * @return {int} the defense power of the animal.
 */
getDefense: function(self, pure){
    var rawStat = self.getRawStat(self.stats.defense, self.ivs.defense, self.evs.defense);
    if(!pure)
     rawStat = self.calcStatChanges('defense', rawStat);
    return Math.round(rawStat);
},
   
/**   
 * Returns the maximum price of the tiles this animal can walk over in one turn.
 * That is, if all tiles have a price of 1, it can go over [speed] tiles.
 * @return {int}    the speed of this animal. 
 */
getSpeed: function(self){
    //evs: half of max gives bonus point, full points gives 2 points
    var bonusPoints = 0;
    if(self.evs.speed == EV_MAX){
        bonusPoints = 2;
    }
    else if(self.evs.speed >= EV_MIDDLE){
        bonusPoints = 1;
    }
    
    var rawSpeed = self.stats.speed + bonusPoints;
    
    //apply stat changes
    var finalSpeed = self.calcStatChanges('speed', rawSpeed);
    return finalSpeed;
},   

/**
 * Change how much HP the animal has.
 * @param {int} hp  how much HP the animal should have now. 
 */
setHP: function(self, hp){
    self.currentHP = hp;
    if(self.currentHP > self.getMaxHP()){
        self.currentHP = self.getMaxHP();
    }
    self.updateQtip();
    
    //update hp bar
    updateHPBar(self.hpBar, self, false); 
},

/**
 * This animal loses some HP. Checks if this animal died, tool
 * @param {int} hpToLose    how much HP to deduct from the current amount. 
 * @param {Animal} damager  [optional] the animal who is doing the damage; omit (or pass null) if damage is passive. If this animal is killed, the damager will be notified.
 * @param {boolean}      [optional, default false] if true, we won't show the log saying the animal was hurt.
 * @return {boolean}    true if this animal died, false otherwise.
 */
loseHP: function(self, hpToLose, damager, dontLog){
    waitForAnimations(function(){ //TODO death takes a long time to register with this setup... consider not having this or doing some other way to wait??
    //wait! see if we're ok with passive damage (active (attacked) damage already handled in getDamageMultiplierDefense)
    if(!damager){
        //no attacker, hurt by passive damage
        hpToLose = self.getPassiveDamage(hpToLose);
    }
    
    hpToLose = hpToLose.round();
    self.setHP(self.currentHP - hpToLose);
    //self.showBadge("-" + hpToLose, "red");
    if(!dontLog){
     log(self.name + " lost " + hpToLose + " HP!", self.themes.loseHP);
    }
    
    if(self.currentHP <= 0){
         //waitForAnimations(function(){
             //we died
             //are we ok with it?
             var dontDie = self.onBeforeDeath(); //false or the # of hp to have left over
             if(dontDie){
                  //don't want to die, leave with however much HP we want
                  self.setHP(dontDie);
             }
             else{
                 //going to die
                 if(damager){
                     //we were attacked!
                     self.defeated(damager);
                     damager.foeDefeated(self);
                 }
                 else{
                      self.defeated(null);
                 }
             }
        //});//
    }
    }, damager ? damager.div : null);
},

/**
 * The animal gains a set amount of HP. It ensures that the animal doesn't have more HP than its max.
 * @param {float} hpToGain    how much HP the user is to gain, at best. It's cast to an int.
 * @return {int} how much HP was really gained; this is usually the same as hpToGain except when the user's HP tops out.
 */
gainHP: function(self, hpToGain, showLog){
    hpToGain = hpToGain.round();
    var oldHP = self.currentHP;
    self.setHP(self.currentHP + hpToGain);
    var hpGained = self.currentHP - oldHP;
    //self.showBadge("+" + hpGained, "green");
    if(hpGained != 0)
     log(sprintf('%s gained %s HP!', self.name, hpGained), 'success');
    return hpGained;
},

/**
 * Convenience method. The animal gains the given percent of their maximum HP.
 * Percents are 100-based; 50 means half the max health.
 * @param {float} percent   a number in the range [0, 100]. 
 * @return {int} how much HP (amount) was gained.
 */
gainHPPercent: function(self, percent){
    return self.gainHP(self.getMaxHP() * percent / 100);
},

/**
 * Returns the HP percent this animal has.
 * @return {int}    an int in the range [0, 100]; it's 100-based so 50 means half health, for example
 */
getHPPercent: function(self){
    return Math.round(self.currentHP / self.getMaxHP() * 100);
},

isDead: function(self){
     return self.currentHP <= 0;     
},

/**
 * Makes the user's current HP match their max HP - so they have 100% health. No more, no less.
 * @param {boolean} showLog   [optional, default false] whether to show a log entry that they gained HP.
 */
fullHeal: function(self, showLog){
    self.setHP(self.getMaxHP());
    if(showLog)
     log(self.name + ' regained all their HP!', 'success');
},

/**
 *
 * Used by abilities to quickly calculate values based on the number of EVs the user has in their ability.
 * 
 * Pass either 1 or 2 arguments.
 * 
 * If 1:
 * @param {String} a   a math expression. Use "e" as the variable. There will be 0-25 EVs.
 * 
 * 
 * If 2:
 * @param {float}   a    the lower bound (this is returned if there are 0 EVs.)
 * @param {float}   b    the upper bound (this is returned if there are 25 EVs.) 
 * 
 * 
 * Method 2 is easier. Intermediate values will be scaled linearly with method 2.
 *  For more fine-grained control, use method 1.
 * 
 * The following are equivalent:
 * abilityCalc(10,15)
 * abilityCalc("10+e/5")
 * 
 * @return {float}  the parsed and executed expression, with the number of ability EVs substituted for e. 
 * 
 */
abilityCalc: function(self, a, b){
     if(b === undefined){
          //1-var
         var e = self.evs.ability;
         return eval(a);             
     }
     else{
          //2-var
          return a + (b-a)/EV_MAX*self.evs.ability;
     }
 
},

initQtip: function(self){
  self.div.popover({
    title:      sprintf("<div class='text-%s'>%s</div>", self.popoverTheme, self.name),
    trigger:    'manual',
    //placement:  'bottom',
    //delay:      { show: 0, hide: 1e9 }, //TODO make this last forever if you're hovering over popover itself or over animal, but go away immediately after you leave those divs
    content:    self.getPopoverHTML, //it'll call that function whenever popup is shown
    html:       true
  });  
   
   //self.updateQtip();
},


/*
 * Briefly shows the popover.
 */
showPopover: function(self){
   //also show popover since we're handling click
   self.div.popover('show');   
   (function(){ self.div.popover('hide') }).delay(1000);
   /*var html = self.getPopoverHTML();
   noty({
     text: html,
     layout: 'topCenter',
     type: self.dialogueType.cssClass,
     animation: {
          open: {height: 'toggle'},
          close: {height: 'toggle'},
          easing: 'swing',
          speed: 250 //default 500
     },   
     timeout: 3000
    });   */
},

/**
 * Returns the HTML that should be found in the Popover (info about this animal). 
 */
getPopoverHTML: function(self){
    //grab template and change it
    var qtip = getClonedTemplate('popover-template');
    
    //update HP bar width & text
    qtip.find('.hp-bar').css('width', self.getHPPercent() + '%');
    qtip.find('.hp-bar').html(sprintf("%d/%d", self.currentHP, self.getMaxHP())); //TODO make this relative to entire bar not just filled part
    //add green/yellow/red coloring
    qtip.find('.hp-bar').removeClass('bar-success bar-warning bar-danger');
    var hpp = self.getHPPercent();
    var cssClass;
    if(hpp <= CRIT_HP_BOUNDARY) cssClass = 'bar-danger'; //red
    else if(hpp >= OK_HP_BOUNDARY) cssClass = 'bar-success'; //green
    else cssClass = 'bar-warning'; //yellow
    qtip.find('.hp-bar').addClass(cssClass);
    
    /* //TODO implement something where subclasses pitch in, since this EXP is only available for allies
    //update exp bar
    var trueExp = self.experience - self.level * EXPERIENCE_PER_LEVEL; //how much you have for this next level
    var expPercent = (trueExp / EXPERIENCE_PER_LEVEL) * 100; //0.5 -> 50
    qtip.find('.exp-bar').css('width', expPercent + '%');
    qtip.find('.exp-bar').html(sprintf("%d/%d", trueExp)); //TODO make this relative to entire bar not just filled part
    */
        
        
    //update stat table
    var levelText = qtip.find('.stat-level-text');
    var attackText = qtip.find('.stat-attack-text');
    var defenseText = qtip.find('.stat-defense-text');
    levelText.html(self.level);
    attackText.html(self.getAttack());
    defenseText.html(self.getDefense());
    

    //are stats (atk,def) being helped or hurt? (net effect of multiplier)
    var attackChange = self.getAttack(false) - self.getAttack(true); //false means we want changes factored in; true means we want pure; so a + value means we have net good boosts
    attackText.removeClass('text-success').removeClass('text-error');
    if(attackChange > 0) attackText.addClass('text-success');
    if(attackChange < 0) attackText.addClass('text-error');
    
    var defenseChange =  self.getDefense(false) - self.getDefense(true);
    defenseText.removeClass('text-success').removeClass('text-error');
    if(defenseChange > 0) defenseText.addClass('text-success');
    if(defenseChange < 0) defenseText.addClass('text-error');    
    
    //ability
    qtip.find('.ability-name').html(sprintf("Ability: %s", self.ability.name));
    qtip.find('.ability-description').html(self.ability.description);
    
    //TODO add afflictions
    
    return qtip.html();  
},

updateQtip: function(self){
    //useless 
},

/**
 * Displays information (HP, attack, etc.) of this animal in a dialog. 
 */
showInfoDialog: function(self){
    var modal = $('#animal-dialog');
    
    //first, hide anything ally/enemy only; show them in subclasses
    modal.find('.ally-only').hide();
    modal.find('.enemy-only').hide();
    
    //name etc
     $('#animal-dialog-char-name').html(self.name);
     $('#animal-dialog-char-type').html(self.type);    
    
    //update HP bar width & text
    updateHPBar(modal.find('.progress'), self, true);
    
    /* //TODO implement something where subclasses pitch in, since this EXP is only available for allies
    //update exp bar
    var trueExp = self.experience - self.level * EXPERIENCE_PER_LEVEL; //how much you have for this next level
    var expPercent = (trueExp / EXPERIENCE_PER_LEVEL) * 100; //0.5 -> 50
    modal.find('.exp-bar').css('width', expPercent + '%');
    modal.find('.exp-bar').html(sprintf("%d/%d", trueExp)); //TODO make this relative to entire bar not just filled part
    */
        
    //update stat table
    var levelText = modal.find('.stat-level-text');
    var attackText = modal.find('.stat-attack-text');
    var defenseText = modal.find('.stat-defense-text');
    levelText.html(self.level);
    attackText.html(self.getAttack());
    defenseText.html(self.getDefense());

    //are stats (atk,def) being helped or hurt? (net effect of multiplier)
    var attackChange = self.getAttack(false) - self.getAttack(true); //false means we want changes factored in; true means we want pure; so a + value means we have net good boosts
    if(attackChange > 0) attackText.addClass('text-success');
    if(attackChange < 0) attackText.addClass('text-error');
    
    var defenseChange =  self.getDefense(false) - self.getDefense(true);
    if(defenseChange > 0) defenseText.addClass('text-success');
    if(defenseChange < 0) defenseText.addClass('text-error');    
    
    //ability
    modal.find('.ability-name').html(sprintf("Ability: %s", self.ability.name));
    modal.find('.ability-description').html(self.ability.description);    
    
    //individual contributions from subclasses
    self.extendInfoDialog(modal);
    
    modal.modal();
},

/**
 * VIRTUAL - PLEASE EXTEND 
 * Subclasses: add your own info to information dialog. Don't bother showing the modal since that's already taken care of.
 * @param {jQuery} modal the modal (dialog) whose contents you can change around.
 */
extendInfoDialog: function(modal){},

/**
 * The new version of the popover - shows just the animal's HP. For more info see the long-click popover 
 */
/*
getTooltipHTML: function(self){
    var qtip = getClonedTemplate('tooltip-template');
    
    //update HP bar width & text
    qtip.find('.hp-bar').css('width', self.getHPPercent() + '%');
    qtip.find('.hp-bar').html(sprintf("%d/%d", self.currentHP, self.getMaxHP())); //TODO make this relative to entire bar not just filled part
    //add green/yellow/red coloring
    qtip.find('.hp-bar').removeClass('bar-success bar-warning bar-danger');
    var hpp = self.getHPPercent();
    var cssClass;
    if(hpp <= CRIT_HP_BOUNDARY) cssClass = 'bar-danger'; //red
    else if(hpp >= OK_HP_BOUNDARY) cssClass = 'bar-success'; //green
    else cssClass = 'bar-warning'; //yellow
    qtip.find('.hp-bar').addClass(cssClass);
    
    return qtip.html();
},
*/

/**
 * Dispels fog around the given tile. 
 */
dispelFog: function(self, tile){
     self.team.dispelFog(tile, self.fogDispelRadius);     
},

/**
 * FINAL - stop overriding!
 * Returns true if this and the other animal are on the same team.
 */
isFriendOf: function(self, other){ 
     return self.team.name == other.team.name;
},

/**
 * Returns info about the team (see TEAM_TYPES - this returns the object). 
 * @DEPRECATED - just use self.team!
 */
getTeamInfo: function(self){
     return self.team;
},

logDamaged: function(self, text){
  
},

/**
 * VIRTUAL - subclasses override with name of your class 
 */
getClass: function(){ return "Animal" },

/**
 * Calls the class's normal method.
 * Use this when overriding a method, but you still want to call your original function.
 * myFunc: function(self, x){ self.super("myFunc", x); self.super("myFunc", x); } //every call to myFunc done twice
 * @param {String} method   the name of the method to call.
 * @param {...} args    everything after method should be the args to pass to the method. (Exclude self).
 */
normal: function(self, method){
    var funcArgs = Array.create(arguments).from(2);
    var func = eval(self.getClass()).prototype[method];
    return func(self, funcArgs[0], funcArgs[1], funcArgs[2], funcArgs[3], funcArgs[4], funcArgs[5]); //do it the hard way  
},

/**
 * @Override from Actor
 * Beginning-of-level initialization. 
 */
initForLevel: function(self){
   //console.log(self.name);     
   //add tooltip w/ HP
   //bind to eventLayer since badges go on image
   /*self.eventLayer.tooltip({
        html: true,
        placement: "top",
        title: self.getTooltipHTML,
        trigger: "hover focus",
        //delay: {show: 0, hide: 1e9}
   });*/
},

/*
 * Call this at the beginning of a function to prevent methods from ending the turn. You'll have to do it manually at the end of the turn (call finishTurn()).
 * Useful for abilities that do things like attack twice, attack and move again, etc. which would ordinarily trigger the turn to end in the middle of your action.
 */
suppressAutoEndTurn: function(self){
     self.autoEndTurn = false;
},

allowAutoEndTurn: function(self){
     self.autoEndTurn = true;
},

/**
 * Internal methods should use this. Tries to finish a turn, but only if auto ending a turn is not suppressed.
 * @return {boolean}     whether or not the turn ended (i.e. if auto ending turns is on.) 
 */
tryFinishing: function(self){
     if(self.autoEndTurn) self.finishTurn();
     return self.autoEndTurn;
},

/**
 * Call this method when this animal is finished moving, attacking, etc. and is finished for this turn. 
 * You can call this as many times as you like per animal (since calling it early won't impact your ability to complete your turn)
 */
finishTurn: function(self){
     //alert level
     level.animalEndedTurn(self);
     self.moved = true;
     self.onFinish();     

},

/**
 * Called when this animal's turn is over; as in, once you've moved. NOT when the whole team is finished.
 * DON'T handle any communication w/ the level. This is only for animal.
 */
onFinish: function(self){
     //reduce turns left of all status changes
     //TODO consider moving to team turn end
     self.statChanges.forEach(function(statChange){
          var done = statChange.reduceTurns();
          if(done){ //get rid of it!
               self.statChanges = self.statChanges.subtract(statChange);
          }   
     });
},

/**
 * Called whe this animal's TEAM is beginning a new turn. 
 */
onTeamTurnStart: function(self){
     //TODO make the sprite "pop" once it's their turn
     self.moved = false;
     //make us active
     //self.div.removeClass('inactive');
     /* TODO reset sprite */     
},

/**
 * Called once this animal's TEAM is finished with their turn and the other guys get to go.
 */
onTeamTurnEnd: function(self){
     //self.div.addClass('inactive');
     /* TODO make sprite inactive */
},

/**
 * Called by the Team object that adds this animal to it. 
 */
addedToTeam: function(self, team){
   self.team = team;  
   self.div.addClass(self.team.cssClass); 
},

/**
 * Determines if the other animal is a friend or foe. Use this if you need a TARGET_TYPE.
 * @param {Animal} other
 * @return {String}     TARGET_TYPES.friend or TARGET_TYPES.foe. 
 */
getTargetTypeOf: function(self, other){
    if(self.isFriendOf(other)) return TARGET_TYPES.friend;
    else return TARGET_TYPES.foe;
},

/**
 * Determines if the other animal is in range of this; that is, this can interact with that this turn.
 * @param {Animal}  other   another animal
 * @return {boolean}    true if the other is within move/attack range, false otherwise 
 */
isInRange: function(self, other){
    var tilesInRange = level.getTilesInRange(self);
    //is the other animal's tile in this?
    return tilesInRange.indexOf(other.tile) != -1;
},

//overridden from actor
interactWith: function(self, other){
     self.suppressAutoEndTurn();
    if(other instanceof Animal){
        //try to use an action on it
        var viableActions = self.actions.filter(function(action){
             return action.canBeUsed(self, other);
        });
        
        if(viableActions.length == 0){
            //can't do anything
            self.allowAutoEndTurn();
            return;
        }
        else if(viableActions.length == 1){
            //only one choice, use that
            self.useAction(viableActions[0], other);
            //can't do anything
            self.allowAutoEndTurn();
            self.tryFinishing();            
        }
        else{
            //>1 action, decide which to use
            //delegate to subclasses
            self.chooseAction(viableActions, other);
            //now that function will end the turn for us
        }
    }
    if(other instanceof Steppable){
        //steppable will deal with it on its own
        //take no action here
            //can't do anything
            self.allowAutoEndTurn();
            self.tryFinishing();        
    }
},

useAction: function(self, action, target){
     //we'll handle turn ending manually here
     self.suppressAutoEndTurn();
    action.activate(self, target);
    self.allowAutoEndTurn();  
    self.tryFinishing();  
},

/**
 * VIRTUAL - subclasses override 
 * Given a choice of actions, choose one (ask user or compare with priority).
 * Call self.useAction(actionChosen, target) to use the action.
 * THIS SHOULD END THE TURN!
 * @param {Action[]} actions    a list of actions that CAN be used; choose one and use it. There will be 2+, guaranteed.
 * @param {Animal} target   the animal this action will be used against.
 */
chooseAction: function(self, actions, target){},

/**
 * The user invokes its ability. Use this if the user has an InvokableAbility. 
 * Only call this if you know it's proper to use the ability - we won't check if we should.
 */
useAbility: function(self){
    //only invoke if we have uses left
    if(self.abilityUses < self.getMaxAbilityUses()){
        var wasAbilityUsed = self.invokeAbility();
        if(wasAbilityUsed){
          self.abilityUsed();
        }
    }
    //self.updateQtip();
},

/**
 * Called only once ability has been successfully used. This handles ending turn, incrementing ability uses, etc. 
 */
abilityUsed: function(self){
   self.abilityUses++;
   self.tryFinishing();     
},

reduceTileToPrice: function(self, tile){
    var cost = 0;
    //bg cost
    var bg = tile.background;
    var bgCost = 1;
    //go through BG types to find what it matches
    for(var i=0; i<BG_TYPES.length; i++){
        if(BG_TYPES[i] == bg){
            //i = index of tile type, find matching terrain cost
            bgCost = self.terrainCosts[i];
        }
    }
    cost += bgCost;
    
    //stuff in tile
    var contentsCost = 0;
    tile.getContents().forEach(function(content){
        //<TODO>: improve this (have specific costs for each obstacle)
        if(self.canStepOn(content) == false)
            cost = 0;        
    });
    
    return cost;
},

/**
 * Based on the contents of the tile, determines if the actor can step on it.
 * @param {Tile} tile   a tile to check
 * @return {boolean} true if it's possible for this animal to step on it (terrain not impassable, and no unsteppable contents), false otherwise
 */
canStepOnTile: function(self, tile){
     var ok = true;
     tile.forEachContents(function(contents){
          if(self.canStepOn(contents) == false) ok = false;
     })
    if(self.reduceTileToPrice(tile) == GraphNodeType.WALL) ok = false;
    return ok;
},

canStepOn: function(self, actor){
    if(actor instanceof Animal
    || actor instanceof NPC) return false;
    if(actor instanceof Obstacle) return false; //<TODO>: let you step over mountains and trees
    
    if(actor.cantStepOn) return false; //manual overrides from steppables
    
    return true;    
},

/**
 * Returns true if the animal is allowed to interact with another even if they're on different tiles.
 * Actors that can only be interacted with if stepped on will return false;
 * @param {Actor} actor another actor you interacted with from a distance
 * @return {boolean} 
 */
canInteractAtDistance: function(self, actor){
    return actor instanceof Animal || actor instanceof NPC || (actor instanceof Obstacle && actor.canBeInteractedWith(self));
},

/**
 * Returns true if this animal is allowed to attack the other.
 * The other must be an Animal and not a friend of this.
 * This doesn't check if the other is in range.
 * @param {Actor} other something to check. Should be an animal, but it's OK if it isn't. That just returns false.
 */
canAttack: function(self, other){
    if(!other) return false;
    if(other instanceof Animal == false) return false;
    if(self.isFriendOf(other)) return false;
    
    return true;
},

/**
 * This animal executes a melee attack on the defender. This function is broken down into a bunch of smaller parts.
 * Depending on the defender's response, the attack may not be executed.
 * @param {Animal} defender an animal to attack. It may not be attacked (but if there's an attack, it's guaranteed that this animal will be targeted.)
 * @param {Object} options    [optional] can contain:
 *   {float} multiplier pass if you want to increase/reduce the power of the attack outside of the getMultiplier() functions. Omit to make it 1. This and the defender's getDamageMultiplier() will be notified of this base multiplier.
 *   {float} accuracy    chance of hit.
 * @return {Object} contains a lot of information about the attack. May not contain all of these, depending on what happens.
 *  int damage
 *  boolean foeDefeated
 *  boolean miss         only given if attack missed. If this happens, no other info will be given.
 * See damageFoe() for more info.
 */
attack: function(self, defender, options){
     var defaults = {
          multiplier:         1,
          accuracy:           self.accuracy,
          criticalMult:       self.criticalDamageMultiplier,
          criticalChance:     self.chanceOfCritical
     };
     options = Object.merge(defaults, options, true, true);
     var baseMultiplier;
    //make sure we can actually attack...
    if(!self.canAttack(defender))
        return;
        
    //animate moving
    self.animateOnto(defender.tile);    
    
    //miss?
    if(!pushLuck(options.accuracy)){
         //miss!
         log(sprintf("%s tried to hit %s, but missed!", self.name, defender.name), 'alert');
         return { miss: true };
    }
        
    //calculate damage
    var rawDamage = self.calculateRawDamage(defender);
    //get custom multipliers from attacker (this) and defender
    var multiplier = options.multiplier;
    multiplier = self.getDamageMultiplierAttack(defender, multiplier);
    multiplier = defender.getDamageMultiplierDefense(self, multiplier);
    
    //critical hits - they nullify all damage changes (TODO Perhaps go like pokemon - keep your pos changes and foe's neg changes?)
    if(self.tryForEffect(options.criticalChance)){
         multiplier = options.criticalMult;
         log(sprintf("%s scored a critical hit!", self.name), self.themes.attack);
    }
    
    //multiply raw by this multiplier, then apply variation
    rawDamage *= multiplier;
    var finalDamage = randomVariation(rawDamage);
    if(finalDamage != 0 && finalDamage < 1) finalDamage = 1; //do at least some damage; if dmg = 0 it missed
    
    //custom functions from abilities
    //these guys can manually add/sub damage using there
    //TODO consider putting in DamageFoe() so that special attacks can't pass this
    finalDamage = self.changeDamageAttack(finalDamage);
    finalDamage = defender.changeDamageDefense(finalDamage);
    
    //if they return true, that's a sign to exit this function
    //<TODO>: possibly, put this inside the damageFoe() function
        //that way it'll run when abilities call it too
    if(self.customAttackFunction(defender, finalDamage)
       || defender.customDefenseFunction(self, finalDamage)) return;
    
    //finally, damage foe
    var result = self.damageFoe(defender, finalDamage); //it returns a lot of data
    self.tryFinishing();
    return result;  
},

/*
 * TODO make a function that lets you do damage with "power". Abilities would use this if they don't want to base it off the animal's attack power (for example, Easter Egg might use it to hurt a foe.) The ability EVs would determine power.
 * NEW: you CAN'T base it off normal attack. Just do .attack() for that, seriously.
 * 
 * Usage: specialAttack(foe, 50) meaning to use an average-powered special attack (melee-level power, so about 25-30%)
 * 
 * @param {Animal} defender   an animal to target.
 * @param {int} power
 *   This is like  "base stat" so 20-80 range... use AbilityCalc to change the power. EVs won't do anything when calc'ing stat, so just have it update power. This allows for more flexibility, plus EVs don't change the stat THAT much.
 *   We'll calculate a special attack for this animal based on EVs = 0, base = power, IVs = an actual IV we have
 *   calc raw damage using this special and defender's defense
 * @return {Object} lots of info - see damageFoe(). Contains:
 *   int damage
 *   boolean foeDefeated
 */
specialAttack: function(self, defender, power){
     //calculate a special attack stat; EVs = 0, base = power, IVs = our attack evs?
     var evs = self.evs.attack;
     var specialAttack = self.getRawStat(power, self.ivs.ability, evs); //base iv ev
     //get raw damage
     var damage = self.calculateRawDamage(defender, specialAttack); //by default it'll get defender's normal defense; TODO perhaps change so animal has special defense??
     //apply it
     //right now this bypasses custom attack/defense functions; TODO consider allowing this (just copy from attack())
     //TODO have a special customSpecialAttackFunction and customSpecialDefenseFunction for the purposes of fortitude etc
     var result = self.damageFoe(defender, power);
     self.tryFinishing();
     return result;
},

/**
 * This animal does damage to the defender. The defender may die.
 * This is usually called by Animal.attack() - the melee attack.
 * You can also call this straight from an ability - that makes it a special attack.
 * Warning: this does not take multipliers etc into account.
 * @param {Animal} defender the animal to damage.
 * @param {int} finalDamage how much damage to do to the animal.
 * @return {Object} contains a lot of information about the damage. We take care of gaining XP and all so this is only for your perusal.
 *  int damage
 *  boolean foeDefeated
 */
damageFoe: function(self, defender, finalDamage){
    //defender loses hp
    var didDie = defender.loseHP(finalDamage, self);
    
    self.onAfterAttack(defender, finalDamage);
    
    return {
        damage: finalDamage,
        foeDefeated: didDie   
    };
},

/**
 * Algorithm to determine the raw damage done by this animal onto the defender.
 * Use getAttack() and getDefense() to get stats.
 * @param {Animal} defender the animal who is being attacked.
 * @param {int} attack   [optional] Default = attacker's attack stat. Or pass an attack stat to use instead (i.e. special attack or something.)
 * @param {int} defense  [optional] Default = defender's defense stat. Or pass a different defense stat to use instead.
 * @return {float} how much damage the attack shold do, sans multipliers or anything.
 */
calculateRawDamage: function(self, defender, attack, defense){
    //attack belongs to attacker, defense to defender
    if(!attack)
     attack = self.getAttack();
    if(!defense)
     var defense = defender.getDefense();
    var level = self.level;
    
    //constants - thanks David for helping figure these out
    var alpha = 0.4696;
    var beta  = 0.296;
    var delta = 2.71828;
    var gamma = 4.914*delta; //=13.358
    
    var damage = ((attack / defense + alpha) * beta) * (level * delta + gamma);
    
    return damage; 
},

/**
 * Use as a substitute for pushLuck().
 * Use this to determine if you should apply a side effect (e.g. stunning), or activate some luck-based ability (e.g. absorption.)
 * @param {float} chance the base chance of the effect happening. This may be modified.
 * @param {Animal} defender   [optional] who you're trying to effect on. Don't pass if you're doing this effect to yourself.
 * @return {boolean} true if you should enact the effect, false otherwise
 */
tryForEffect: function(self, chance, defender){
     //try weather too
     if(level.effectChanceMult){
          //yup it's on
          chance *= level.effectChanceMult;
     }
     
     chance = self.changeEffectChanceAttack(chance);
     if(defender)
          chance = defender.changeEffectChanceDefense(chance);
     
     if(pushLuck(chance)) return true;
     else return false;
},


////Attack virtual methods
/**
 * VIRTUAL - for abilities
 * Allows you to manipulate the damage multiplier. You're given the original multiplier - no one else besides attack() has manipulated it.
 * @param {Animal} defender the animal you are attacking. Don't manipulate it, just read it.
 * @param {float} originalMultiplier    the multiplier that attack() created earlier. You can read this and use it to determine what to do, but make sure you return original * [whatever].
 * @return {float}
 */
getDamageMultiplierAttack: function(self, defender, originalMultiplier){ return originalMultiplier; },

/**
 * VIRTUAL - for abilities
 * Allows you to manipulate the final amount of damage being dealt. Warning - don't do multipliers here; this is only for niche case where you want to add/sub flat amount of damage.
 * @param {int} finalDamage   how much damage you're going to do (unless you change it). All multipliers/randomness worked in. 
 * @return {int} how much damage you want to do (default the original amount.) Feel free to change this but be careful. NOTE - changeDamageDefense() runs after this so there's no guarantee that this will be how much damage is done
 */
changeDamageAttack: function(self, finalDamage){ return finalDamage; },

/** 
 * VIRTUAL - used by abilities
 * A custom function that is called right before the actual damaging is done.
 * You can manipulate yourself or the defender.
 * Handle anything like stunning the foe or boosting your attack here.
 * Return true to cancel the attack.
 * @param {Animal} defender
 * @param {int} finalDamage how much damage you will do. It is guaranteed to be this much.
 * @return {boolean} true if you want to cancel the attack.
 */
customAttackFunction: function(self, defender, finalDamage){ return false; },

/**
 * VIRTUAL - for subclasses
 * Called after this animal has executed an attack and damaged the foe (it may be dead.)
 * Don't manipulate the defender any more! (do that in customAttackFunction). Just read it.
 * Essentially, this is the same as customAttackFunction, except subclasses override this one.
 * @param {Animal} defender the animal you attacked
 * @param {int} damageDone  how much damage this animal did 
 */
onAfterAttack: function(self, defender, damageDone){},

/**
 * VIRTUAL - for subclasses
 * Called when this animal kills the foe it damaged. The defender is alerted (defeated()) before this is called.
 * Don't manipulate the defender.
 * @param {Animal} the animal that this animal killed.
 */
foeDefeated: function(self, defender){},

/**
 * VIRTUAL - for abilities
 * You can change the chance of a side effect here. NOT USED RIGHT NOW.
 */
changeEffectChanceAttack: function(self, chance){ return chance; },

////Defense virtual methods
/**
 * VIRTUAL - for abilities
 * Allows you to manipulate the damage multiplier. You're given the multiplier after it's been manipulated by the attacker.
 * @param {Animal} attacker the animal that is attacking you. Don't manipulate it, just read it.
 * @param {float} originalMultiplier    the multiplier that attack() created and the attacker manipulated. You can read this and use it to determine what to do, but make sure you return original * [whatever].
 * @return {float}
 */
getDamageMultiplierDefense: function(self, attacker, originalMultiplier){ return originalMultiplier; },

/**
 * VIRTUAL - for abilities
 * Allows you to manipulate the final amount of damage being done to you. Warning - don't do multipliers here; this is only for niche case where you want to add/sub flat amount of damage.
 * @param {int} finalDamage   how much damage will be done to you (unless you change it). All multipliers/randomness worked in. 
 * @return {int} how much damage you want to take (default the original amount.) Feel free to change this but be careful. This is the absolute final amount.
 */
changeDamageDefense: function(self, finalDamage){ return finalDamage; },

/**
 * VIRTUAL - used by abilities
 * A custom function that is called right before the actual damaging is done.
 * You can manipulate the attacker or yourself.
 * Handle anything like hurting the enemy (Firewall/rough skin) or reflexing the attack here.
 * If you want to cancel the attack, return true.
 * @param {Animal} attacker
 * @param {int} finalDamage the damage that will be done to you. It is guaranteed to be this much.
 * @return {boolean}    true if the attack should not go through.
 */
customDefenseFunction: function(self, attacker, finalDamage){ return false; },
   
/**
 * VIRTUAL - for abilities
 * Called right before you're about to die. You can hang on, punish your killer, etc.
 * You can stop your death by returning true. But be careful you actually have some HP.
 * @param {Animal} attacker the animal that's going to kill you.
 * @param {int} damageDone  how much damage they did to kill you.
 * @return {boolean} true to stop your death, false to proceed
 */
onBeforeDeath: function(self, attacker, damageDone){ return false; },  
   
/**
 * VIRTUAL - for subclasses
 * Called when this animal has been killed by another animal.
 * You can manipulate the attacker
 * @param {Animal} attacker the animal that killed you, or null if it was self-inflicted
 */
defeated: function(self, attacker){}, 

/**
 * VIRTUAL - for abilities 
 * Called when this animal is hit by passive damage.
 * Determine how much passive damage this animal should take.
 * Passive damage is damage not done by an attacker - field hazards, weather, etc.
 * @param {int} damage  how much passive damage this animal SHOULD take normally
 * @return {int}    how much passive damage this animal will take. It can be set to 0, for example, to make this animal immune to passive damage.
 */
getPassiveDamage: function(self, damage){ return damage; },

/**
 * VIRTUAL - for abilities
 * You can change the chance of a side effect here. This is called at the VERY END, even after the attacker's contribution.
 */
changeEffectChanceDefense: function(self, chance){ return chance; }

//TODO: add another function called when you die (so you can have aftermath - hurt who killed you)
   
});
