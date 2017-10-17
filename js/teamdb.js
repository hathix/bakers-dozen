var TeamDB = new Singleton({
     
__init__: function(self){
     self.teams = []; //Team[]
     /*self.db = {
          "allies": new Team("allies","Your team","ally"),     
          "enemies":new Team("enemies","The enemies","enemies")
          
     };*/
},

/**
 * Returns the team with the given name.
 * @param {String} name  the team name. See TEAM_NAMES.
 * @return {Team}   Note that the team you get here may akways be different
 */
get: function(self, name){
     //return Object.clone(self.db[name]);
     return self._db(name);
},

/**
 * PRIVATE (other classes: use get())
 * Returns a team.
 * We're doing this dynamically to prevent junk from building up in the teams (since they're dynamic.)
 */
_db: function(self, name){
     var team = self.teams.filter(function(team){ return team.name == name; }); //Array.find() causes errors w/ sugar/Cobra
     return team[0];
},

/**
 * Returns true if teams have been loaded, false otherwise. 
 */
hasTeams: function(self){
     return self.teams.length > 0;
},

/**
 * Returns a list of all teams. 
 */
getAllTeams: function(self){
     return self.teams;
},

/*
 * Adds a team to storage.
 * @param {COMPRESSED TEAM} team   the team, but IN COMPRESSED FORM!
 */
add: function(self, team){
     var existingTeams = orDefault($.store.get(SL_KEYS.teams), []);
     existingTeams.add(team);
     $.store.set(SL_KEYS.teams, existingTeams);
     
     self.loadFromStorage();
},

remove: function(self, teamName){
     var rawTeams = $.store.get(SL_KEYS.teams);
     rawTeams = rawTeams.filter(function(raw){
          return raw.name !== teamName;
     });
     $.store.set(SL_KEYS.teams, rawTeams);
},

/**
 * Reads the teams stored in localStorage and loads them in. Call at start of human v. human or human v. cpu game. 
 */
loadFromStorage: function(self){
     //the teams in storage keep track of their name and animals
     var rawTeams = $.store.get(SL_KEYS.teams);
     if(!rawTeams){
     	//got nothing...
     	return;
     }
     var goodTeams = rawTeams.map(function(raw){
          var name = raw.name;
          
          var rawAnimals = raw.animals;
          var goodAnimals = rawAnimals.map(function(rawAnimal){
               var goodAnimal = new Ally(
                    //in init: type, name, level, teamName, optionalAttrs
                    rawAnimal.type,
                    rawAnimal.name,
                    MAX_LEVEL, //TODO let you change what level to play at
                    "" //team name set @ runtime
               );
               goodAnimal.evs = rawAnimal.evs;
               return goodAnimal;
          });
          
          return new Team(name, name, "", goodAnimals); //team type set at runtime
     });
     self.teams = goodTeams;
},

/**
 * Loads the default teams: allies or enemies. Call at start of a normal (adventure) game.
 */
loadDefault: function(self){
     var teams = [
          new Team("allies","Your team","ally"),     
          new Team("enemies","The enemies","enemy")          
     ];
     self.teams = teams;
},
     
});
