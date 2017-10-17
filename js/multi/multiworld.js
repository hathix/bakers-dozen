/**
 * A world for human v. human games.
 * 
 */
var MultiWorld = new Class({
     
__extends__: World,

/**
 * Creates and loads this world. The global "world" now refers to this.
 */
__init__: function(self, options){
    var defaultOptions = {
     logTurns: true, //whether or not to log the start/end of turns    
    };
    options = Object.merge(defaultOptions, options, true, true); //it is deep, and 2nd thing (passed options) override defaults
    Class.ancestor(MultiWorld, '__init__', self, options);
    
    self.levels = []; //we store levels straight in an array... forget chapters!
    self.teamsPlaying = []; //list of teams who are playing
},

/**
 * Starts off a new game between humans. Call this once you're ready to play multiplayer.
 * Doesn't guarantee that game will start - user must confirm.
 */
newGame: function(self){
     TeamDB.loadFromStorage();
     //ask user to choose a team
     var allTeams = TeamDB.getAllTeams();
     
     //load team choose dialog
     var modal = $('#team-choose-dialog');
     modal.find('.text-error').html('');
     $('#team-buttons-group').html('');
     allTeams.forEach(function(team){
          //name is unique
          var button = getClonedTemplate('team-button-template');
          button.find('.team-choose-name').html(team.name);
          //TODO add images of animals
          
          $('#team-buttons-group').append(button);     
     });
     $('#multiplayer-start').click(function(){
          //grab teams... must be the right amount!
          var checkedButtons = $('#team-buttons-group').find('button.active');
          var length = checkedButtons.length;
          if(length < MIN_TEAMS || length > MAX_TEAMS){
               //oops! too many/too few
               modal.find('.text-error').html(sprintf("You have chosen %s team(s); you must choose between %s and %s, inclusive!", length, MIN_TEAMS, MAX_TEAMS));
          }
          else{
               //figure out their teams, and let's go
               var teams = checkedButtons.map(function(){
                    var teamName = $(this).find('.team-choose-name').html();
                    var team = TeamDB.get(teamName);
                    return team;
               });
               teams = teams.get(); //grab normal array out of teams (which is a jQuery obj)
               modal.modal('hide');
               self.startWithTeams(teams);
          }
          
     });
     modal.modal('show');
},

/**
 * Begins the game, given a list of teams who will be playing (look at TeamDB.getAllTeams().)
 * @param [Team[]] teamsPlaying    All the teams who will be in on this multiplayer battle. Max length of this is MAX_TEAMS.
 */
startWithTeams: function(self, teamsPlaying){
     //end old world/level/stuff
     if(level)
          level.end();
               
     self.teamsPlaying = teamsPlaying;
     
     //based on who's playing, assign colors: team1, team2, team3, team4
     for(var i=0; i<self.teamsPlaying.length; i++){
          self.teamsPlaying[i].cssClass  = "team" + (i+1); //0=>3 becomes 1 => 4
     }
     
     //all team init done... tell them to get ready w/ animals
     self.teamsPlaying.forEach(function(team){
          team.readyAnimals();
     });
     
     //load 1st level!
     var level = multiLevels[0];
     self.setLevel(level);
     level.load();     
},

load: function(self){
    
},

save: function(self){
    
},

});
