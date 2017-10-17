var Affliction = new Class({
   
/**
 * Creates a temporary status effect, like sleep/confuse/burn.
 * This can be good (swapping stats temporarily)
 * 
 * @param {String} id    a unique identifier for this change, like 'asleep'. If there are 2 stat changes w/ same id, the older one is thrown out. Use AFFLICTIONS enum.
 * @param {int}     turns     how many turns it lasts. This is counted from the END of your current turn. i.e. if a change lasts for 1 turn, it will be applied at the end of this turn, continue all throughout your next turn, and disappear once you're finished that turn. Your next turn will be fine. Pass FOREVER for the stat change to last, well, forever.
 */
__init__: function(self, id, turns){
    self.id = id;
    self.turns = turns;
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
