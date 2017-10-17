var StatChange = new Class({
   
/**
 * Creates a temporary stat change.
 * @param {String} id    a unique identifier for this change, like 'losedamage1'. If there are 2 stat changes w/ same id, the older one is thrown out.
 * @param {String} stat either 'attack', 'defense', 'speed'
 * @param {String} change   instructions on how to change the animal's final stat. "+5" adds a flat 5 (not recommended). "*5" multiplies by 5. "=5" makes it exactly 5. You can use the following: +-* /
 * @param {int}     turns     how many turns it lasts. This is counted from the END of your current turn. i.e. if a change lasts for 1 turn, it will be applied at the end of this turn, continue all throughout your next turn, and disappear once you're finished that turn. Your next turn will be fine. Pass FOREVER for the stat change to last, well, forever.
 */
__init__: function(self, id, stat, change, turns){
    self.stat = stat;
    self.change = change;
    self.id = id;
    self.turns = turns;
},

/**
 * Applies this state change to a stat.
 * @param {int} originalStat  the normal stat without any multipliers.
 * @return {int}    the stat after it's been changed by this stat change. 
 */
changeStat: function(self, originalStat){
    //it's like +5 or *5 or =5
    var operator = self.change.first(); //first char, +-*/=
    var rawChange = self.change.from(1); //+15 -> 15
    
    //if it's =, just return that
    if(operator == "=") return rawChange.toNumber();
    
    //so it's a +-*/
    return eval(sprintf("%s %s %s", originalStat, operator, rawChange)).toNumber();
},

/**
 * A turn passes. 
 * @return {boolean}     true if this stat change is finished.
 */
reduceTurns: function(self){
     if(self.turns == FOREVER){
          //this is a perpetual stat change that will last forevermore
          return false; //this stat change is never done
     }
     
     self.turns--;
     //if this goes below 0 we're done...
     //if we started @ 1 and our turn ends we're at 0 but we have another turn to go. So on any turn where we end below 0 that means we're done.
     return (self.turns < 0);
},

});
