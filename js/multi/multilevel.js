/**
 * A multiplayer (human v human) level. 
 * The current World MUST be MultiWorld.
 */
var MultiLevel = new Class({
__extends__: BattleLevel,

/**
 * 
 * @param {Object} self
 * @param {Object} rawTiles
 * @param {Object} background
 * @param {Coords[][]} startingLocations     in format: [ *for team 1* [Coords, Coords, Coords], *for team 2* [Coords, Coords, Coords], ... ]. That is, one row for each team, and within each put a coords where each animal should go. You have no idea which team will go where.
 */
__init__: function(self, name, rawTiles, background, startingLocations){
   Class.ancestor(MultiLevel, '__init__', self, rawTiles, [], background, [], null);
   self.name = name;
   self.startingLocations = startingLocations;
},

loadAllies: function(self){
     self.prepareTeams();
     //get allies
     var allies = [];
     self.teams.forEach(function(team){
          allies.add(team.animals);
     });
     
     return allies;
},

placeAllies: function(self, allyLocations){
     //forget allyLocations - we have our startingLocations
     for(var i=0; i<self.teams.length; i++){
          //give startinglocations[i] to teams[i]
          var locs = self.startingLocations[i];
          var team = self.teams[i];
          //now give each loc to each animal in turn
          for(var j=0; j<team.animals.length; j++){
               team.animals[j].putInView(locs[j]);
          }
     }
},

prepareTeams: function(self){
   self.teams = world.teamsPlaying; //multiworld will have this
},

getWinner: function(self){
     //this is a fight to the death; only team left standing wins
     if(!self.isOneSided()) return false; //not done yet
     else return self.teams[0]; //winner    
},

exit: function(self){
     self.end();
     //go back to multiplayer main screen
}

});
