var BattleLevel = new Class({
__extends__: Level,

__init__: function(self, rawTiles, allyLocations, background, exits, startingConversationFn){
   Class.ancestor(BattleLevel, '__init__', self, 0, rawTiles, allyLocations, background, exits, startingConversationFn);
   //stageNumber set by levelgroup later
},

loadAllies: function(self){
    //grab all allies marked as active
    var allies = world.getActiveAllies();
    //return allies;
    //TODO because levels SHOULD allow you to place as many active allies as you have
    //if they don't then inactivate some
    //only return as many as we have space for... TODO ask user which ones to take
    var maxPlaces = self.allyLocations.length;
    return allies.first(maxPlaces);
}, 

//Place Allies: just go default


/**
 * Places Fog of war and does other pre-turn preparations. 
 * @param {Team} teamToStart     the team that's starting
 */
onBeforeTurnStart: function(self, teamToStart){
     teamToStart.fog.forEach(function(fogTile){
          //put fog in that tile
          var fog = new Steppable("Fog");
          fogTile.addContents(fog);     
     });
},

});
