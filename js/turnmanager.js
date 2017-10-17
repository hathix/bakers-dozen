/**
 * Manages turns (ending one, creating one, etc.)
 * Create a new one for each level.
 * Interfaces with level only - not animals (besides referencing them.)
 */
var TurnManager = new Class({

__init__: function(self, level){
     self.level = level;
     self.currentTeam = null; //who's up now
     self.whoMoved = []; //who's moved this turn
},

/**
 * Begins a brand new turn. Call this externally.
 * @param {String} teamName   the name of the team who's up now. Use TURN_TYPES.
 */
startTurn: function(self, team){
     if(self.currentTeam == team){
          //you can't go twice in a row! just reset
          return;
     }
     if(world.options.logTurns){
          //TODO perhaps show an overlay saying they're up (like Fire Emblem does)
          var formalName = team.formalName;
          log(formalName + " are up!");
          console.log(team.name + " START");
     }
     //console.log(teamName + " are starting");
     self.currentTeam = team;
     self.whoMoved = [];
},

/**
 * Ends the current turn. ONLY TO BE CALLED FROM THIS CLASS.
 */
_endTurn: function(self){
     /*if(self.ended){
          //this turn is already done, don't do this again
          return;
     }*/
     
     console.log(self.currentTeam.name + " END");
     
     //rotate through to next team name
     var newTeam = self.getTeamAfter(self.currentTeam);
     
     //console.log(self.currentTeamName + " is ending");
     self.level.finishTurn(self.currentTeam, newTeam);
     
},

/**
 * Called when an animal ended/finished their turn. 
 * @param {Animal} animal
 */
animalEndedTurn: function(self, animal){ 
     //if there's only one team, don't even bother keeping track - turn never dies
     //or, if we're already done, don't do this whole thing again (could be firing several times)
     if(self.level.isOneSided() || self.isFinished()){
          return;
     }
     
     if(world.options.logTurns){
          console.log(animal.name + " is done");
     }
     
     self.whoMoved.add(animal.id);
     //check how many animals of this team name there are, and see if they've all moved
     //do this dynamically since people may die, join, etc.
     //every member of the team (from level) MUST be in the whoMoved but not vice versa
     /* Logging */
     /*if(whoDidntMove.isEmpty() == false){
          var didntMoveNames = whoDidntMove.map('name').join(',');
          console.log(didntMoveNames + " have not moved yet");
     }*/
     if(self.isFinished()){
          //we're good! turn finished!
          self._endTurn();
     }
},

/**
 * @return {boolean} true if everyone who should have moved has moved, false otherwise
 */
isFinished: function(self){
     var memberIDs = self.level.getAnimalsByTeam(self.currentTeam).map('id'); //all members of the team
     var isFinished = true;
     memberIDs.forEach(function(id){
          if(isFinished == false) return;
          
          //ensure that this member's id appears somewhere in whoMoved
          if(self.whoMoved.indexOf(id) == -1){
               //whomoved does not have this id, meaning they haven't moved yet
               isFinished = false;
          }
     });
     return isFinished;          
},

/**
 * Returns the name of the team that's up after a certain team. 
 * @param {Team} teamName   Any team. May or may not be up right now.
 * @return {Team} the team that's next
 */
getTeamAfter: function(self, team){
     var teams = self.level.teams;
     var currIndex = teams.map('name').findIndex(function(x){ return x == team.name }); //we do this w/ names since enhanced array matching w/ Cobra objects gets messy (findIndex throws weird errors)
     var newIndex = currIndex + 1;
     if(newIndex == teams.length) newIndex = 0; //wraparound
     return teams[newIndex];
},
     
});
