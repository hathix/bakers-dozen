/**
 * Contains each ability, which can be merged in with an animal to enhance & individualize them.
 * API:
 *  Ability get(String name)
 */
var abilityDB = new Singleton({

/**
 * Returns the ability of the animal.
 * @param {String} name the name of the ability.
 * @return {Ability} an Ability object - InnateAbility, InvokableAbility, or ActionAbility.
 */
get: function(self, name){          
    
    switch(name){
        
/* INNATE */       
        
case "Clutch": return new InnateAbility(
    "Clutch",
    "Does more damage in a pinch",
    {
        getDamageMultiplierAttack: function(self, defender, multiplier){
            if(self.getHPPercent() < 33){
                log("SO CUTTERED", 'info');
                return multiplier * self.abilityCalc(1.25,1.50);
            }
            return multiplier;
        },
    }    
);       

case "Finisher": return new InnateAbility(
    "Finisher",
    "Does more damage to weakened foes",
    {
        getDamageMultiplierAttack: function(self, defender, multiplier){
            if(defender.getHPPercent() < 33)
                return multiplier * self.abilityCalc(1.25,1.50);
            return multiplier;
        }
    }    
);  

case "Bamboomerang": return new InnateAbility(
    "Bamboomerang",
    "Attacks hit twice",
    {
        attack: function(self, defender, baseMultiplier){
             //self.suppressAutoEndTurn(); //this prevents attack from ending turn early //not needed since you can call finish several times
             
            baseMultiplier = orDefault(baseMultiplier, 1);
            baseMultiplier *= self.abilityCalc(1,1.25);
            for(var i=0; i<2; i++){
                self.normal("attack", defender, baseMultiplier);
                if(defender.isDead()) break;        
            }
            
            //self.finishTurn();
        }
    }    
); 

case "NineLives": return new InnateAbility(
    "Nine Lives",
    "Sometimes survives fatal attacks",
    {
        onBeforeDeath: function(self, attacker, damageDone){
            //chance of returning true - which means not dying after all
            var chanceOfSurvival = self.abilityCalc(0.1,0.2);
            if(self.tryForEffect(chanceOfSurvival)){
                //survive!
                console.log("Not dead!");
                return 1; //live with 1 hp
            }
            else{
                //die
                return false;
            }
        }
    }    
); 

case "SpikySkin": return new InnateAbility(
    "Spiky Skin",
    "Attackers get hurt slightly",
    {
        customDefenseFunction: function(self, attacker, finalDamage){
            //do a fraction of their damage back onto them
            var damagePercent = self.abilityCalc(10,25); //this is divided by 100
            self.damageFoe(attacker, Math.round(finalDamage * damagePercent / 100));
        }
    }    
); 

case "Reflex": return new InnateAbility(
    "Reflex",
    "Foe's attacks may rebound",
    {
        customDefenseFunction: function(self, attacker, finalDamage){
            //chance of stopping attack and having it rebound on them
            var chance = self.abilityCalc(0.1,0.25);
            if(self.tryForEffect(chance, attacker)){
                //reflex it! have them hurt themselves for full damage
                self.damageFoe(attacker, finalDamage);
                console.log("SO CUTTERED - BY YOURSELF");
                return true; //don't hurt us
            }    
        }
    }    
); 

case "Absorption": return new InnateAbility(
    "Absorption",
    "Foe's attacks may be absorbed into HP",
    {
        customDefenseFunction: function(self, attacker, finalDamage){
            //chance of stopping attack and gaining that HP back
            var chance = self.abilityCalc(0.1,0.25);
            var hpReturn = self.abilityCalc(0.25,0.50); //how much you gain of the attack
            if(self.tryForEffect(chance)){
                //absorb it - turn it into HP
                self.gainHP(finalDamage * hpReturn);
                console.log("SO NOT CUTTERED");
                return true; //don't hurt us
            }    
        }
    }    
); 

case "Steadfast": return new InnateAbility(
    "Steadfast",
    "Ignores damage multipliers",
    {
        getDamageMultiplierDefense: function(self, attacker, originalMultiplier){
             //get originalMultiplier closer to 1
             var variance = originalMultiplier - 1; //- if a weaker attack, + if a stronger
             variance *= self.abilityCalc(0.5,0);
             var newMultiplier = 1 + variance;
             
             return newMultiplier;
        }
    }    
); 

case "Resistant": return new InnateAbility(
    "Resistant",
    "Takes less passive damage",
    {
        getPassiveDamage: function(self, damage){
            //get it closer to 0; apply multiplier
            //at 25 evs, it's 0
            var damageMultiplier = self.abilityCalc(0.5, 0);
            damage *= damageMultiplier;
            return damage.round();
        }
    }    
); 

case "Generator": return new InnateAbility(
    "Generator",
    "Gains HP with every step",
    {
        moveTo: function(self, tile, interact){
            //hijack; gain HP
            var chanceOfGain = self.abilityCalc(0.25,0.50);
            if(self.tryForEffect(chanceOfGain)){
                var gain = self.getHPPercent() * 0.5 / 100; //half a percent of hp
                gain = gain.round();
                if(gain < 1) gain = 1; //always get at least 1
                self.gainHP(gain);
            }
            
            //continue
            self.normal("moveTo", tile, interact);
        }
    }    
); 

case "Dire": return new InnateAbility(
    "Dire",
    "Higher chance of critical hit",
    {
        updateFields: function(self){
            var multiplier = self.abilityCalc(1.5,3);
            self.chanceOfCritical *= multiplier;
        }
    }    
); 

case "Menacing": return new InnateAbility(
    "Menacing",
    "Critical hits do more damage",
    {
        updateFields: function(self){
            var multiplierAddition = self.abilityCalc(0.5,2);
            self.criticalDamageMultiplier += multiplierAddition; //just adding to the chance, not multiplying
        }
    }    
); 

case "Sniper": return new InnateAbility(
    "Sniper",
    "Can attack from 2 spaces away",
    {
        updateFields: function(self){
            self.range = 2;
        },
        
        getDamageMultiplierAttack: function(self, defender, originalMultiplier){
            //here's where the penalty's applied. You lose some power at distance unless you have max ev's.
            if(self.tile.distanceTo(defender.tile) > 1){
                //ranged attack, penalize
                var multiplier = self.abilityCalc(0.75,1);
                return originalMultiplier * multiplier;
            }
            else{
                return originalMultiplier; //no penalty for range 1
            }
        }
    }    
); 

case "Brave": return new InnateAbility(
    "Brave",
    "Attack boost when facing more powerful foe",
    {
        
        getDamageMultiplierAttack: function(self, defender, originalMultiplier){
            //are they stronger?
            var attackRatio = defender.getAttack() / self.getAttack();
            if(attackRatio >= self.abilityCalc(1.3,1.15)){
                 //yes, they're strong enough. apply mult
                 return originalMultiplier * self.abilityCalc(1.15,1.3);
            }
            else{
                 //not a good enough ratio
                 return originalMultiplier;
            }
        }
    }    
); 

case "Finisher": return new InnateAbility(
    "Finisher",
    "Does more damage to weakened foes",
    {
        
        getDamageMultiplierAttack: function(self, defender, originalMultiplier){
            //are they weak enough?
            if(defender.getHPPercent() <= self.abilityCalc(35, 50)){
                 //yes, they're strong enough. apply mult
                 return originalMultiplier * self.abilityCalc(1.1,1.2);
            }
            else{
                 //not a good enough ratio
                 return originalMultiplier;
            }
        }
    }    
); 

case "Herd": return new InnateAbility(
    "Herd",
    "Attack boost when surrounded by friends",
    {
        
        getDamageMultiplierAttack: function(self, defender, originalMultiplier){
            //TODO consider making this a boost to attack (stat) instead... but then when would we apply the statchange?
            //get adj friends
            var allFriends = level.getFriends(self);
            var radius = self.abilityCalc(1,3); //TODO is 3 OP?
            var adjFriends = allFriends.filter(function(friend){
               return self.tile.distanceTo(friend.tile) <= radius;
            });
            var numAdjFriends = adjFriends.length;
            var multMult = Math.pow(self.abilityCalc(1.1,1.2), numAdjFriends);
            multMult = confine(multMult, 1, 2.5); //last num: max multiplier inc
            return originalMultiplier * multMult;
        }
    }    
); 

case "Pride": return new InnateAbility(
    "Pride",
    "Gains attack after every kill",
    {
        kills: 0,
        
        foeDefeated: function(self, defender){
          self.kills++;
          self.kills = confine(self.kills,0,5); //can't have too many kills - then it gets out of hand!
          var multiplier = Math.pow(self.abilityCalc(1.1,1.2), self.kills); //1.x^kills; multiplying up
          self.applyStatChange(new StatChange('pride','attack','*' + multiplier,FOREVER));
          
          self.normal("foeDefeated", defender);     
        }
    }    
);

case "FleetFoot": return new InnateAbility(
    "Fleet Foot",
    "Can move again after killing",
    {
        foeDefeated: function(self, defender){
             //TODO get this to work... improve turn handling    
          self.suppressAutoEndTurn();
          console.log("KILLED!");
          
          self.normal("foeDefeated", defender);     
        }
    }    
); 

/*
case "InnateTemp": return new InnateAbility(
    "name",
    "desc",
    {
        //code
    }    
); 
*/

/* INVOKABLE */

case "Refresh": return new InvokableAbility(
    "Refresh",
    "Regains some HP",
    [5,15],
    function(self){ //invoke
        self.gainHPPercent(self.abilityCalc(25,50));
        
        return true;
    },
    function(self){ //shouldInvoke
        //use if you're low on health
        return pushLuck(1 - self.getHPPercent() / 100 ); //high health -> 0%, low health -> 100%
    }
);

case "SpinAttack": return new InvokableAbility(
    "Spin Attack",
    "Damages all nearby foes",
    [5,10],
    function(self){ //invoke
         self.suppressAutoEndTurn();
         
         //find all foes in radius
         var radius = self.abilityCalc(1,2);
         var foes = level.getFoes(self).filter(function(foe){
              return self.tile.distanceTo(foe.tile) <= radius;
         });
         
         //attack all of them
         var damageMult = self.abilityCalc(0.75,0.95);
         foes.forEach(function(foe){
          self.attack(foe, {multiplier: damageMult});     
         });
         
         self.allowAutoEndTurn();
        return true;
    },
    function(self){ //shouldInvoke
         return pushLuck(0.3); //TODO make it fire if there are 2+ nearby foes
    }
);

case "Quack": return new InvokableAbility(
    "Quack",
    "Damages all nearby foes",
    [5,5],
    function(self){ //invoke
         //find all foes in radius
         var radius = self.abilityCalc(8,12);
         var percent = self.abilityCalc(2.5,4);
         var foes = level.getFoes(self).filter(function(foe){
              return self.tile.distanceTo(foe.tile) <= radius;
         });
         foes.forEach(function(foe){
              var damage = Math.round(foe.getMaxHP() * percent / 100);
              self.damageFoe(foe, damage);
         });
        return true;
    },
    function(self){ //shouldInvoke
         return true;
    }
);

case "Roost": return new InvokableAbility(
    "Roost",
    "Regains some HP and boosts stats",
    [10, 20],
    function(self){ //invoke
        self.gainHPPercent(self.abilityCalc(5, 10));
        var statMultiplier = self.abilityCalc(1.05, 1.10);
        var turns = 2;
        self.applyStatChange(new StatChange("RoostA", "attack", "*" + statMultiplier, turns));
        self.applyStatChange(new StatChange("RoostD", "defense", "*" + statMultiplier, turns));
        
        return true;
    },
    function(self){ //shouldInvoke
        //use if you're low on health
        return pushLuck(1 - self.getHPPercent() / 100 ); //high health -> 0%, low health -> 100%
    }
);

case "Molt": return new InvokableAbility(
    "Molt",
    "Drops defense but boosts attack",
    [1,1],
    function(self){ //invoke
         var defenseMult = 0.6;
         var attackMult = self.abilityCalc(1.3, 1.6);
        var turns = FOREVER;
        self.applyStatChange(new StatChange("MoltA", "attack", "*" + attackMult, turns));
        self.applyStatChange(new StatChange("MoltD", "defense", "*" + defenseMult, turns));
        
        return true;
    },
    function(self){ //shouldInvoke
         return pushLuck(0.3);
    }
);

case "PowerSwap": return new InvokableAbility(
    "Power Swap",
    "Temporarily swaps attack and defense",
    [2,5],
    function(self){ //invoke
         var attack = self.getAttack(); //including boosts
         var defense = self.getDefense(); 
        var turns = self.abilityCalc(4,8);
        self.applyStatChange(new StatChange("psA", "attack", "=" + defense, turns)); //yes swap stats
        self.applyStatChange(new StatChange("psD", "defense", "=" + attack, turns));
        
        return true;
    },
    function(self){ //shouldInvoke
         return pushLuck(0.3);
    }
);

case "Mist": return new InvokableAbility(
    "Mist",
    "Clears all stat changes",
    [1,5],
    function(self){ //invoke
         //remove all animals' stat changes
        level.getAnimals().forEach(function(animal){
             animal.clearStatChanges();
        });
        return true;
    },
    function(self){ //shouldInvoke
         return pushLuck(0.3);
    }
);

case "DeepFreeze": return new InvokableAbility(
    "Deep Freeze",
    "Turns water into ice",
    [2,5],
    function(self){ //invoke
         //TODO let this work if you're an enemy
         if(self instanceof Ally){
          var maxDistance = self.abilityCalc(1,2);
          var tiles = level.getTilesSuchThat(function(tile){
               //in range, & watery
               var bg = backgroundConverter[tile.getBackground()];
               //if the tile's empty, convert to level bg
               if(bg == "empty"){
                    bg = level.background;
               }
               var dist = tile.distanceTo(self.tile);
               return dist <= maxDistance && bg.indexOf('water') != -1;
          });
          
          //de-highlight anything if it's already there
          self.stopSelecting();
          
          level.requestTile(tiles, "item-highlight", function(tile){
               //turn to ice
               tile.setBackground("i");
               
              // self.stopSelecting(); 
              self.selectingTile = false;
              
              //we're done turn 
              self.abilityUsed();
          });
          
          self.selectingTile = true; //so if user re-clicks tile, the highlights will go away (ally already handles clicking)
         
          return false;   
         }
         
         return false;
    },
    function(self){ //shouldInvoke
        //use if you're low on health
        return pushLuck(1 - self.getHPPercent() / 100 ); //high health -> 0%, low health -> 100%
    }
);

case "Knight": return new InvokableAbility(
    "Knight",
    "Move in an L shape and jump over obstacles",
    [5, 10],
    function(self){ //invoke
         //TODO let this work if you're an enemy
         if(self instanceof Ally){
          //get all tiles
          var tiles = level.getTilesSuchThat(function(tile){
               //dx = 1 & dy = 2 or VV
               //must be able to step on it
               var dist = tile.getAbsoluteXYTo(self.tile);
               return self.canStepOnTile(tile) && ((dist.dx == 1 && dist.dy == 2) || (dist.dx == 2 && dist.dy == 1));
          });
          
          //de-highlight anything if it's already there
          self.stopSelecting();
          
          level.requestTile(tiles, "move-highlight", function(tile){
               //move there
               self.moveTo(tile);  
               
              // self.stopSelecting(); 
              self.selectingTile = false;
              
              //we're done turn 
              self.abilityUsed();
          });
          
          self.selectingTile = true; //so if user re-clicks tile, the highlights will go away (ally already handles clicking)
         
          return false;   
         }
         
         return false;
    },
    function(self){ //shouldInvoke
        return pushLuck(0.2);
    }
);

case "StealthAcorn": return new InvokableAbility(
    "Stealth Acorn",
    "Places damaging acorns nearby",
    [2,3],
    function(self){ //invoke
         log(self.name + ' tossed acorns!','info')
        //make acorns and put them near you; get 4 and tell them to scoot
        var tosser = self.teamName;
        var numAcorns = self.abilityCalc(3,5).round(); //self.abilityCalc("2+e/25*2").round();
        var damagePercent = self.abilityCalc(5,15);
        for(var i=0; i<numAcorns; i++){
            var acorn = new Steppable("Acorn", { tosser: self.team.name, damage: damagePercent });
            level.addActor(acorn, self.tile.coords);
            acorn.scoot();
        }
        
        return true;
    },
    function(self){ //shouldInvoke
        //just randomly use
        return pushLuck(0.25);
    }
);

case "Substitute": return new InvokableAbility(
    "Substitute",
    "Makes a substitute that will take damage for you",
    [2,4],
    function(self){ //invoke
        if(self.substitute){
             //don't throw up another one!
             return false;
        }
        var hpPercent = 0.25; //how much of your hp will be in sup
        var hpInSub = Math.floor(hpPercent * self.getMaxHP()); //let's be nice by doing floor not normal round
        if(hpInSub >= self.currentHP){
             //not enough hp to make a sub
             log(self.name + " wanted to make a Substitute, but doesn't have enough HP!", 'info');
             return false;
        }
        
        //ok so let's make the sub
        //cut hp, put in sub
        self.loseHP(hpInSub);
        self.substitute = true;
        self.substituteHP = hpInSub;
        log(self.name + " made a Substitute!","info");
        
        //change sprite to sub
        self.originalType = self.type;
        self.setType('Substitute');
        
        return true;
    },
    function(self){ //shouldInvoke
        //just randomly use
        return pushLuck(0.25);
    },
    {
         //custom code
         originalType: null,
         substitute: false, //true if you have one
         substituteHP: 0, //how much HP the substitute has left
         
         clearSubstitute: function(self){
              if(self.substitute){
                   //change back to how we used to be
                   self.substitute = false;
                   self.setType(self.originalType);  
              }            
         },
         
         //Substitute absorbs damage from attacks... not residual or anything (even special atm, unless this func is put in damagefoe)
         changeDamageDefense: function(self, damage){
              if(self.substitute){
                   //substitute will take damage for you
                   self.substituteHP -= damage;
                   log(sprintf("The Substitute took %d damage for %s!", damage, self.name), "info");
                   if(self.substituteHP <= 0){
                        //substitute is dead
                        log(sprintf("%s's Substitute faded!", self.name), "info");
                        self.clearSubstitute();
                   }
                   
                   return 0; //either way, the sub absorbs all damage... yes even if it didn't have enough HP
              }
              else{
                   //sorry, no substitute = no help
                   return damage;
              }
         },
         
         onLevelEnd: function(self){
          self.clearSubstitute();
          self.normal('onLevelEnd');     
         },
    }
);

/*
case "InvokableTemp": return new InvokableAbility(
    "name",
    "desc",
    [10,20], //uses; will be passed to Animal.abilityCalc. first num is base, last num is with all evs
    function(self){ //invoke; return true if this should count as a move (false otherwise)
        return true;
    },
    function(self){ //shouldInvoke; return boolean
        
    },
); 

//ALSO:
    {
         //customCode; optional
    }
*/

/*
case "ActionTemp": return new ActionAbility(new Action(
    "name",
    "desc", 
    TARGET_TYPES.foe, //who to hit
    -1, //priority
    function(self, target){ //activate
        
    },
    function(self, target){ //shouldUse
        
    })
); 

OPTIONAL:
     3rd func:
     function(self, target){ //canUse
          //by default anyone adjacent can have action used on them; this is custom
          //return true if ok, false if not   
     }
*/

/* ACTION */

case "Bananarama": return new ActionAbility(new Action(
    "Bananarama",
    "Powerful attack, but has recoil",
    TARGET_TYPES.foe,
    -1, //DETERMINE WHAT TO DO
    function(self, target){ //activate
        var returnValue = self.attack(target, {multiplier: 1.2});
        if(returnValue.miss) return;
        self.loseHP(returnValue.damage / 3);        
    },
    function(self, target){ //shouldUse
        //only if we have enough health (don't want to kill ourselves)
        if(self.getHPPercent() < 10) return false;
        //don't do it if you could kill the target normally
        if(target.getHPPercent() < 10) return false;
        return true;
    })
); 

case "EasterEgg": return new ActionAbility(new Action(
    "Easter Egg",
    "Either hurts foe or heals them",
    TARGET_TYPES.foe,
    -1,
    function(self, target){ //activate
        //more chance of hitting at higher level; more damage done then
        //min EVs: hits 50% of time, does ~10% or heals ~10%
        //max EVs: hits 75% of time, does ~35% or heals ~10%
        
        //do we hit?
        if(self.tryForEffect(self.abilityCalc(.50,.75))){
            //yes! got heeem!
            //calc damage
            var damagePercent = self.abilityCalc(0.1,0.35); //float, 0-1
            //calc real numerical damage (based on enemy's max HP)
            var calcDamage = target.currentHP * damagePercent;
            var realDamage = randomVariation(calcDamage); //apply randomness
            
            //do the damage
            self.damageFoe(target, realDamage);
        }
        else{
            //nope! heal 'em
            //calc healing
            var healingPercent = self.abilityCalc(10,10); //may add in e later (more EVs -> heal less)
            //calc real numerical healing (based on enemy's max HP)
            var calcHeal = target.currentHP * healingPercent;
            var realHeal = randomVariation(calcHeal);
            
            //heal
            target.gainHP(realHeal);
        }
    },
    function(self, target){ //shouldUse
        return true; //always use if possible
    })
); 

case "Kamikaze": return new ActionAbility(new Action(
    "Kamikaze",
    "Does tons of damage, but kills user",
    TARGET_TYPES.foe,
    -1,
    function(self, target){ //activate
        //calc how much damage to do - a multiplier
        var multiplier = self.abilityCalc(2.5,5);
        self.attack(target, {multiplier: multiplier});
        self.loseHP(self.currentHP+1); //lose all current HP (+1 to be safe), self-inflicted wound
    },
    function(self, target){ //shouldUse
        //only if HP is below threshold
        return self.getHPPercent() < 30; //less than this many % (50 = 50%)
    })
); 

case "Sacrifice": return new ActionAbility(new Action(
    "Sacrifice",
    "User dies but gives HP to teammate",
    TARGET_TYPES.friend,
    -1,
    function(self, target){ //activate
         //give some of your HP to ally
         var hpPercent = self.abilityCalc(0.75, 1);
         var hpToGive = Math.round(self.currentHP * hpPercent);
         target.gainHP(hpToGive);
         self.loseHP(self.currentHP + 1); //lose all current HP (+1 to be safe), self-inflicted wound
    },
    function(self, target){ //shouldUse
        //only if HP is below threshold & friend's is to
        return self.getHPPercent() < 50 && target.getHPPercent() < 50;
    })
); 

case "ClawHammer": return new ActionAbility(new Action(
    "Claw Hammer",
    "Very powerful, but reduces attack",
    TARGET_TYPES.foe,
    -1,
    function(self, target){ //activate
        //calc how much damage to do - a multiplier
        var multiplier = self.abilityCalc(2, 3);
        var result = self.attack(target, {multiplier: multiplier});
        if(result.miss){
             //we missed, don't penalize
             return;
        }
        
        //hurt attack stat
        var attackMult = 0.5;
        var turns = self.abilityCalc(5, 3);
        self.applyStatChange(new StatChange('hammerclaw', 'attack', '*' + attackMult, turns));
    },
    function(self, target){ //shouldUse
        //use if target is weak enough that we could kill
        if(target.getHPPercent() < CRIT_HP_BOUNDARY) return true;
        return false;
    })
); 

case "Sting": return new ActionAbility(new Action(
    "Sting",
    "Attacks lightly, then warps away",
    TARGET_TYPES.foe,
    -1,
    function(self, target){ //activate
        var powerMult = self.abilityCalc(0.2, 0.4);
        var distance = self.abilityCalc(2, 4);
        self.attack(target, {multiplier: powerMult});
        
        //get out of here
        var availableTiles = level.getTilesWithinRadius(self.tile.coords, distance);
        var tile = level.getEmptyTile(self, availableTiles);
        self.moveTo(tile);
    },
    function(self, target){ //shouldUse
        //i don't know, random?
        return pushLuck(0.6);
    })
); 


case "Annihilate": return new ActionAbility(new Action(
    "Annihilate",
    "Powerful, but forces recharge unless you kill", 
    TARGET_TYPES.foe, //who to hit
    -1, //priority
    function(self, target){ //activate
        var multiplier = self.abilityCalc(2, 4);
        var accuracy = self.abilityCalc(0.8, 0.9);
        var result = self.attack(target, { multiplier: multiplier, accuracy: accuracy });
        if(result.miss){
             //we missed! oh well; don't penalize
        }
        else if(!result.foeDefeated){
             //target did NOT die; recharge
             self.afflict(new Affliction(AFFLICTIONS.RECHARGE), 1);
        }
    },
    function(self, target){ //shouldUse
        return pushLuck(0.4);
    })
); 

case "Cripple": return new ActionAbility(new Action(
    "Cripple",
    "Slows down foe temporarily", 
    TARGET_TYPES.foe, //who to hit
    -1, //priority
    function(self, target){ //activate
        var result = self.attack(target);
        if(!result.miss && !result.foeDefeated){
             //slow 'em down
             var turns = self.abilityCalc(3,6);
             var mult = self.abilityCalc(0.8,0.6);
             target.applyStatChange(new StatChange("Cripple","speed","*" + mult, turns));
        }
    },
    function(self, target){ //shouldUse
        //i dunno, random?
        return pushLuck(0.4);
    })
); 

case "Vampire": return new ActionAbility(new Action(
    "Vampire",
    "Leaches foe's health", 
    TARGET_TYPES.foe, //who to hit
    -1, //priority
    function(self, target){ //activate
         //special attack
         var power = self.abilityCalc(20, 30);
        var result = self.specialAttack(target, power);
        if(result.damage){
             //we regain a fraction of damage done
             var regenFraction = self.abilityCalc(0.6, 0.8);
             var regenHP = Math.round(damage * regenFraction);
             self.gainHP(regenHP);
        }
    },
    function(self, target){ //shouldUse
        return true; //always use
    })
); 

case "Ditto": return new ActionAbility(new Action(
    "Ditto",
    "Temporarily copies foe's stats", 
    TARGET_TYPES.foe, //who to hit
    -1, //priority
    function(self, target){ //activate
        //grab their stats, except HP
        var attack = target.getAttack(true); //ignore any stat changes
        var defense = target.getDefense(true);
        var speed = target.getSpeed(true);
        
        var turns = self.abilityCalc(2,5);
        self.applyStatChange(new StatChange("DittoA","attack","=" + attack, turns));
        self.applyStatChange(new StatChange("DittoD","defense","=" + defense, turns));
        self.applyStatChange(new StatChange("DittoS","speed","=" + speed, turns));
    },
    function(self, target){ //shouldUse
        //i dunno, random?
        return pushLuck(0.4);
    })
);

case "EggCannon": return new ActionAbility(new Action(
    "Egg Cannon",
    "Damages foe in a straight line", 
    TARGET_TYPES.foe, //who to hit
    -1, //priority
    function(self, target){ //activate
        var power = self.abilityCalc(25, 35);
        self.specialAttack(target, power);
    },
    function(self, target){ //shouldUse
        //i dunno, random?
        return pushLuck(0.4);
    },
    function(self, target){ //canUse
         //must be orthogonal & in range
         var range = self.abilityCalc(5, 8);
         var dist = self.tile.getAbsoluteXYTo(target.tile);
         if(dist.dx == 0){
              //then dy must be in range
              return dy <= range;
         }
         if(dist.dy == 0){
              //then dx must be in range
              return dx <= range;
         }
         return false;
    })
); 

case "Medic": return new ActionAbility(new Action(
    "Medic",
    "Heals any teammate from adistance", 
    TARGET_TYPES.friend, //who to hit
    -1, //priority
    function(self, target){ //activate
        var hpGainPercent = self.abilityCalc(0.15, 0.30);
        var hpGainAmount = Math.round(target.getMaxHP() * hpGainPercent);
        target.gainHP(hpGainAmount);
    },
    function(self, target){ //shouldUse
        //if target is down on HP
        return target.getHPPercent() < 50;
    },
    function(self, target){ //canUse
         //anyone on your team with less than max HP
         return target.currentHP < target.getMaxHP();
    })
); 

case "Warp": return new ActionAbility(new Action(
    "Warp",
    "Moves any teammate", 
    TARGET_TYPES.friend, //who to hit
    -1, //priority
    function(self, target){ //activate
         //ask for somewhere to move them
         var radius = self.abilityCalc(8, 12);
         if(target instanceof Ally){
              var tiles = level.getTilesWithinRadius(target.tile.coords, radius);
               level.requestTile(tiles, "move-highlight", function(tile){
                    //move that ally there
                    target.moveTo(tile);  
                    
                   // self.stopSelecting(); 
                   self.selectingTile = false;
                   
                   //we're done turn 
                   self.abilityUsed();
               });
         }
         //TODO make it work for non-allies
    },
    function(self, target){ //shouldUse
        //uh sure
        return true;
    })
); 

    }
    

//default
return new InnateAbility(
    "name",
    "definition",
    {
        updateFields: function(self){
            //mess with 'em
            self.currentHP = 1/0;
            self.updateQtip();
        }
    }    
); 
    
}



});