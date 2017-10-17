/**
 * Abstract class for a level, or a stage on which there are Actors that can move and interact.
 * This manages the Actors and how they interact.
 * Because it's abstract and subclasses have different features, there are a bunch of mini-methods to override. 
 * 
 * API:
 * 
 * Accessible:
 *  Actor[] actors
 *  Ally[] allies
 *  Enemy[] enemies
 * 
 * Virtual methods:
 *  Ally[] loadAllies()
 *  void placeAllies(Coords[])
 *  Enemy[] loadEnemies() //default implementation: enemies are all Enemy's in self.actors
 *  void onEnd()
 */
var Level = new Class({
   
/**
 * Creates a level.
 * @param {int} stageNumber a unique number identifying this level inside its level group. Use LevelTypes.FIRST (first level loaded when level group starts) or a number greater than that. BATTLE LEVELS: DOESN'T REALLY MATTER SINCE LEVEL GROUP SETS IT ANYWAY.
 * @param {[String bg, Actor, String[] flags][][]} rawTiles  a 2D matrix of arrays that will represent tiles. Each array will contain info on a tile at its row and column. It contains:
 *  String bg: shorthand - "g" for "grass"
 *  Actor: [optional] actor to put in te tile
 *  String[] rawFlags: [optional] info to store in tile as flags
 * One rawTile might look like: ["g", new Enemy(...), ["can-use-item"]].
 * @param {Coords[]} allyLocations  a list of coordinates for where the allies should go. Subclasses may choose not to honor this.
 * @param {String} background   represents the faded background of the page when the level is loaded - the background image behind the tiles. Pass the shorthand (we use utils's backgroundConvert to convert it.)
 * @param {int[]/string[]} exits    contains a list of other levels (their stage numbers) this level links to (usually just 1). Use ints for static stage numbers (not recommended unless you're exiting, in which case pass LevelTypes.EXIT), strings ("+1", "-2", etc) for relative jumps. See LevelGroup.loadLevel() for more info. You can mix and match ints and strings.
 * @param {function() : Conversation} startingConversation  [optional] a function that returns a conversation that will be begun when the level is loaded. It's a function so that it can be called at the right time.
 */
__init__: function(self, stageNumber, rawTiles, allyLocations, background, exits, startingConversationFn){
    self.stageNumber = stageNumber;
    self.tiles = [];
    self.actors = []; //note this doesn't contain actors
    self.rawTiles = rawTiles; //unpack later
    
    //other stuff
    self.allyLocations = allyLocations;
    self.background = backgroundConverter[background];
    self.exits = exits;
    self.startingConversationFn = startingConversationFn;
    self.flags = new Flags();
    self.turnManager = new TurnManager(self);
    self.weather = weatherDB.Normal;
    self.weatherChances = new WeatherChances({
         Night: 0.5,
         //Night: 0.9,
         /*Rain: 0.1,
         Snow: 0.1,
         Storm: 0.1,
         Overcast: 0.1,
         Night: 0.1*/
    })
   
    self.teams = [];    
    
    //temporary
    self.conversation = null;
},

/**
 * VIRTUAL
 * Uses the world.allies array to load the self.allies array with however many allies this level should have.
 * This can be implemented several ways: choose all allies, choose just the active ones, choose just one, etc.
 * @return {Ally[]} an array of allies
 */
loadAllies: function(self){},

/**
 * VIRTUAL, but we've implemented a default
 * Takes the self.allies array and places each ally in a proper location - use ally.putInTile(Coords).
 * We've passed the allyLocations, but you can put the allies somewhere else.
 * The allies you want to load MUST GO IN A TILE.
 * @param {Coords[]} allyLocations  a list of locations that the allies should go in. Use ally.putInTile(Coords) to place an ally in one of these locations.
 */
placeAllies: function(self, allyLocations){
    //do it the normal way: put allies in at the locations
    for(var i=0; i<self.allies.length && i<allyLocations.length; i++){
        self.allies[i].putInView(allyLocations[i]);
    }    
},

/**
 * VIRTUAL 
 * Takes the contents of the self.actors array and returns a specific subset of self.actors - this contains all the enemies.
 * Default implementation: just what it says.
 * @return {Enemy[]} an array of all enemies within self.actors.
 */
loadEnemies: function(self){
    var enemies = [];
    for(var i=0; i<self.actors.length; i++){
        if(self.actors[i] instanceof Enemy)
            enemies.push(self.actors[i]);
    }
    return enemies;
},

/**
 * VIRTUAL
 * Called when this level is about to be onEnded. Do any finalization you want here.
 * You can't change the fact that the level will be onEnded. 
 * Default implementation: do nothing.
 */
onEnd: function(self){},

/**
 * Called when this level is about to be started - this is called at the start of the load function, before anything else is done.
 * Default implementation: do nothing. 
 */
onStart: function(self){},

/**
 * VIRTUAL
 * Decides if the goal is achieved (rout enemy, keep control of fort, etc.)
 * If goal condition is reach flag, put nothing here... manually exit with grid objects
 * Default implementation: level never completed. 
 * @return {Team} the team that won (in this case the level will end), or undefined/false if no one won yet.
 */
getWinner: function(self){ return false; },

/**
 * VIRTUAL
 * Returns the main character. If they die, game over.
 * Subclasses may override.
 */
getMainCharacter: function(self){
    return self.allies[0];
},

/**
 * Returns a list of all animals in this level. 
 */
getAnimals: function(self){
    var animals = [];
    animals.add(self.allies).add(self.enemies);
    return animals;
},

/**
 * Returns a list of all team names, in order, of the animals in this list. You can rotate through since, even if the team names change (some may be removed), the relative ordering will never change.
 * For instance, [team1 team2 team3] -> [team1 team3] if team2 dies.
 * @return {String[]}    a list of team names. Compare to TEAM_NAMES
 */
/*getTeamNames: function(self){
     var teamNames = self.teams.map('name');
     return teamNames;  
},*/

/**
 * Returns true if only 1 team is left. 
 */
isOneSided: function(self){
     return self.teams.length == 1;
},

getAnimalsByTeam: function(self, team){
     return team.animals;
},

getFriends: function(self, viewer){
     return self.getAnimals().filter(function(animal){
          return animal.isFriendOf(viewer);
     });
},

getFoes: function(self, viewer){
     return self.getAnimals().filter(function(animal){
          return !animal.isFriendOf(viewer);
     });
},

/**
 * Returns the actor with the given ID. This is the same ID that the actor's div has.
 * @param {String} id
 * @return {Actor} 
 */
getActorById: function(self, id){
    return self.actors.find(function(actor){
        return actor.id == id;    
    });
},

/**
 * Returns the number of rows in this level's tile grid. 
 */
numRows: function(self){
    return self.tiles.length;
},

/**
 * Returns the number of columns in this level's tile grid.
 */
numCols: function(self){
    return self.tiles[0].length;
},

/**
 * Returns ALL the tiles in this level in a flat (1D) array. They are in no guaranteed order.
 * @return {Tile[]} the tiles in this level. 
 */
getTileList: function(self){
    return self.tiles.flatten();
},

/**
 * Returns the tile at the given coordinates.
 * @param {Coords} coords   the coordinates to find a tile at, or null if the coords are out of bounds
 */
getTile: function(self, coords){
    if(self.isInBounds(coords))
        return self.tiles[coords.y][coords.x];
    return null;
},

/**
 * Returns true if the given coords are legally in bounds in this level.
 * That is, there's a tile at the given coords. 
 */
isInBounds: function(self, coords){
    return coords.y >= 0 && coords.y < self.numRows() && coords.x >= 0 && coords.x < self.numCols();
},

/**
 * Starts a conversation, doing any housekeeping as necessary.
 * CALL THIS, NOT CONVERSATION.START!
 * @param {Conversation}
 */
startConversation: function(self, conversation){
    //<TODO>: if they're trying to start the same conversation that's already going on, return
    //if a conversation is already ongoing, quit before starting this
    if(self.conversation){
        self.endConversation();
    }
    
    self.conversation = conversation;
    conversation.start();
},

/**
 * Ends any conversation that is currently going on in this level. 
 */
endConversation: function(self){
    if(self.conversation){
        var con = self.conversation;
        self.conversation = null;
        con.end();
    }
},

/**
 * Dynamically adds the given actor to the actors list and puts it in the view.
 * @param {Actor} actor the actor to add. WARNING: don't use Animals or Enemies; they won't be put in respective lists.
 * @param {Coords} coords   the coords of the tile to put it in 
 */
addActor: function(self, actor, coords){
    self.actors.push(actor);
    actor.putInView(self.getTile(coords));
},

/**
 * Removes the given actor from any lists it's in and the view. Essentially removing it, period.
 * @param {Actor} actor any actor contained in this level. 
 */
removeActor: function(self, actor){
     //check which teams are up now, and compare to later
     var oldTeams = self.teams;
     
     if(actor instanceof Animal){
         //remove from lists
         //console.log(self.enemies.map('name').join(','));
         self.allies = self.allies.subtract(actor);
         self.enemies = self.enemies.subtract(actor);
         self.actors = self.actors.subtract(actor);
         
         //remove from whatever team it's in
         var team = actor.team;
         team.removeAnimal(actor);
         
         //get rid of team maybe?
         if(team.isDefeated()){
              self.teams = self.teams.subtract(team);
         }
    }
    
    //Get rid of from view
    actor.removeFromView();
    
    //do comparison in other func
    if(actor instanceof Animal){
         self._animalDefeated(actor, oldTeams);
    }
},

/**
 * Called once an animal has been killed. They've already been removed from their various lists.
 * @param {Animal} animal     the animal that just died.
 * @param {Team[]} oldTeamNames  the list of teams before the animal was removed from any lists.
 */
_animalDefeated: function(self, animal, oldTeams){
     console.log(animal.name + " is dead");
     //check if any teams are gone... if so, skip to next turn
     var newTeams = self.teams;
     if(!Object.equal(oldTeams, newTeams)){
          //well, that animal's team must be gone now that that animal died
          //go to next team's turn
          //[1 2 3] -> if 2 lost, it's now [1 3]; if 3 lost, it's now [1 2]
          var teamToStart;
          var oldIndex = oldTeams.map('name').findIndex(animal.team.name);
          if(oldIndex == newTeams.length){
               //that was the last team, now it's gone, so the array is too small
               //loop back around
               teamToStart = newTeams[0];
          }    
          else{
               //the team that lost was in the middle, so everyone else slid down 1
               //so go to the team in the same index
               teamToStart = newTeams[oldIndex];
          }
          
          self.finishTurn(animal.teamName, teamToStart);
     }
},

/**
 * Called whenever an animal finishes its turn.
 * All this does is alerts the turn manager.
 * 
 */
animalEndedTurn: function(self, animal){
     self.turnManager.animalEndedTurn(animal);
},

/**
 * Begins a new turn. You can call this internally or externally. 
 * @param {Team}  teamToStart    the team who should begin their turn.
 */
startTurn: function(self, teamToStart){
     //TODO check if level's over (can't have been one sided from the start) - if so, finish this turn
     waitForAnimations(function(){
     //function(){
          (function(){
          //hold on! what if that team is gone by now??
          while(teamToStart.animals.isEmpty()){
               //go to next team
               teamToStart = self.turnManager.getTeamAfter(teamToStart);
          }               
               self._startTurn(teamToStart);
          }).delay(500); //wait a bit since some people may be dying now... wait for them to disappear
     });
},

/**
 * The actual business logic of startTurn(), without all of the extra boilerplate junk 
 * At this point it is GUARANTEED that we are starting this team's turn immediately. So do any team init here.
 */
_startTurn: function(self, teamToStart){
     self.onBeforeTurnStart(teamToStart);
     
     //start round if this is the first team in the round
     if(teamToStart == self.teams[0]){
          self.startRound();
     }
     
     self.turnManager.startTurn(teamToStart);
     
     //alert animals
     //allies will get choosing if they're up, will stop choosing if they're off
     teamToStart.animals.each(function(animal){ animal.onTeamTurnStart(); });    
     
     //allies will handle themselves (humans are playing); enemies will need to be guided
     if(teamToStart.name == TEAM_NAMES.ENEMIES){
          self._enemyTurn();
     }      
     
     self.onAfterTurnStart(teamToStart);
},

/**
 * VIRTUAL - subclasses override
 * Called before we're ready to start a turn. It is guaranteed that this team is ready to go and will go.
 * @param {String}  teamStarted    the name of the team that's up
 */
onBeforeTurnStart: function(self, teamStarted){},

/**
 * VIRTUAL - subclasses override
 * Called once a turn has been started and everyone has gotten ready. Do final init here 
 * @param {String} teamStarted     the name of the team that has started
 */
onAfterTurnStart: function(self, teamStarted){},

/**
 * Finishes the turn of the guys who are currently up and (potentially) tells the other guys to go.
 */
finishTurn: function(self, finishedTeam, nextTeam){
     //console.log(finishedTeamName);
     //wait! if there's only one team left now (maybe its last member died last turn) then don't really finish - turn never dies
     if(self.isOneSided()){
          //just keep turn alive, don't do anything  
          //re-begin turn of only team that's alive so they stay fresh
          self.startTurn(self.teams[0]);   
     }
     else{
          //end turn
          finishedTeam.animals.each(function(animal){ animal.onTeamTurnEnd(); });
          
          if(finishedTeam == self.teams[self.teams.length-1]){
               //this team is the last in the round (turns where everyone goes); round over
               self.endRound();
          }
     }
     
     //are we done?
     var result = self.getWinner();
     if(result){
          //level done
          //result is the winning team
          //clean up and exit
          log(sprintf("%s WINS!", result.formalName), "success"); //TODO show alert
          (function(){
               self.exit();
          }).delay(1000); //let them bask in glory!
          return;
     }
     else if(!self.isOneSided()){
          //level NOT done, set up for next turn
          self.startTurn(nextTeam);
     }
     //check if we're done
     /**
      * TODO each level needs to specify its end conditoins (flag, rout enemy) 
      *   If it's flag then there's no need for a check if done() method since we'll exit manually
      * Check if it's done
      *   Control fort: add a onTurnEnd() method that will tick up each time a team controls a fort for several turns... if they've controlled long enough we're done!!
      * 
      * 
      */
     /*
     var result = self.isGoalAchieved(); //TODO gives you name of team that won if they won, 'false' otherwise
     if(result){
          //YUP! achieved! now what?
          //TODO end level here
     }
     
     
*/    
},

/**
 * Called when the round begins.
 * A round is a group of turns where everyone goes once. 
 */
startRound: function(self){
     //we should consider starting the weather, provided there's no weather (save normal) going on
     if(self.weather == weatherDB.Normal){
          var weather = self.weatherChances.getWeather();
          self.startWeather(weather);
     }
     
     self.weather.onRoundStart();
},

/**
 * Called when the round ends. 
 */
endRound: function(self){
     self.weather.onRoundEnd();     
},

/**
 * Tells the enemies to move.
 * They should already have been told their turn is starting by startTurn().
 */
_enemyTurn: function(self){
     // TODO implement AI
     var enemyMove = (function(enemy){
          //AI
          //TODO make 'em do something
          //attack if anyone's nearby
          var foes = self.getFoes(enemy); //ie allies
          var hasMoved = false;
          foes.forEach(function(foe){
               if(hasMoved) return;
               //if foe is close, then attack
               if(enemy.tile.distanceTo(foe.tile) <= enemy.range){
                    enemy.interact(foe);
                    hasMoved = true;
               }
          });
          if(!hasMoved){
               //no one near, just move
               enemy.scoot();
               enemy.tryFinishing();               
          }

     }).lazy(ENEMY_TURN_DELAY); //only executes once per this many ms; prevents enemies from appearing like they all move at once

     self.enemies.forEach(function(enemy){
          enemyMove(enemy);
     });
},

startWeather: function(self, weather){
     self.weather = weather;
     weather.onBegin();     
     
     //TODO set timer to see how long it'll take for it to wear off
},

endWeather: function(self){   
     //go back to normal
     self.weather.onFinish();
     self.startWeather(weatherDB.Normal);    
},

/**
 * FINAL
 * Loads this level, placing its tiles on the board.
 * @param {LevelGroup} levelGroup   the group of levels this is in. If it's an overworld level, omit this.
 */
load: function(self, levelGroup){
    world.setLevel(self);
    if(levelGroup)
        self.levelGroup = levelGroup;
    self.onStart();
    
    //unpack the raw tiles from earlier
    var rawTiles = self.rawTiles;
    //raw[0] = bg, raw[1] = actor
    for(var r=0; r<rawTiles.length; r++){
        self.tiles[r] = [];
        for(var c=0; c<rawTiles[0].length; c++){
            var raw = rawTiles[r][c];
            
            //one of 4 cases: just bg, bg&actor, bg&flags, all 3
            //flags MUST be in array form
            //actors MAY be in array form
            var actor = undefined;
            var flags = new Flags();
            if(raw.length == 3){
                //specified all
                actor = raw[1];
                //load flags
                raw[2].forEach(function(string){
                    flags.setFlag(string);    
                });
            }
            else if(raw.length == 2){
                 //if they gave flags, it's in an array of strings
                if(typeof raw[1][0] == "string"){
                    //they gave just flags, add them
                    raw[1].forEach(function(string){
                        flags.setFlag(string);    
                    });
                }
                else{
                    //they gave just actor
                    actor = raw[1];
                }
            }
            
            self.tiles[r][c] = new Tile(new Coords(c, r), raw[0], flags);
            
            //put actor in there if there is any
            if(actor){
                 //just convert to an array for easy manipulation later
                 if(!Object.isArray(actor)) actor = [actor]; //actor is now an array
                 actor.forEach(function(a){
                    a.putInView(self.tiles[r][c]);  //actor notified and tile notified
                    self.actors.push(a);     
                 });
            }
        }
    }    
    
    //allies
    //load allies from world - only take a certain number
    self.allies = self.loadAllies();
    self.allies.forEach(function(ally){
        ally.resetForLevel();
    });
    //put allies in the ally locations (or not)
    self.placeAllies(self.allyLocations);
    //put allies in actors (wasn't loaded earlier)
    for(var i=0; i<self.allies.length; i++){
        self.actors.push(self.allies[i]);
    }
    
    //allies and actors are loaded, now load enemies - a subset of actors
    self.enemies = self.loadEnemies();  
    
    //fill up the $board with our tiles
    var board = $('#board');
    for(var r=0; r<self.numRows(); r++){
        var tr = $('<tr></tr>');
        for(var c=0; c<self.numCols(); c++){
            self.tiles[r][c].addToView(tr);
        }
        board.append(tr);
    }
    
    /** EVERYONE IN VIEW NOW - DO ANY FINAL INIT **/
    
    //load which teams there are
    self.prepareTeams(self.allies.include(self.enemies));
    
    //if any actor has an initForLevel function, call it (that's meant to be called @ start of level)
    self.actors.forEach(function(actor){
         actor.initForLevel();    
    });
    
    //fill up the rest of the screen's background
    $('html').css('background-image', 'url(images/tiles/translucent/' + self.background + '.png)');
    
    //start the starting conversation, if applicable
    if(self.startingConversationFn)
        self.startConversation(self.startingConversationFn());
        
    //let's GO!!!
    //first available team name will start
    var team = self.teams[0];
    self.startTurn(team);    
},

/**
 * Given a list of all the animals in the level, prepares a list of teams in this level.
 */
prepareTeams: function(self, allAnimals){
     self.teams = [];
     
     var rawTeams = allAnimals.groupBy('teamName'); //object: {allies: Animal[], enemies: Animal[]}
     Object.keys(rawTeams, function(teamName, animals){
          //grab the team, get animals from it, assign it to teams
          var team = TeamDB.get(teamName);
          team.addAnimals(animals);
          self.teams.add(team);
     });
},

/**
 * Finishes this level, clearing the board. 
 * DON'T CALL THIS FROM WITHIN THIS CLASS. Call exit() instead.
 */
end: function(self){
    //alert this that the level's ending...
    self.onEnd();
    //stop conversations
    self.endConversation();
    self.endRound(); //get rid of weather
    $.noty.closeAll(); //close logs
    //clear HTML
    $('#board').empty();
    $('#actors').empty();
    //tell actors to leave
    self.actors.forEach(function(actor){
         actor.onLevelEnd();
        actor.removeFromView();    
    });
},

/**
 * Public method to finish this level and load another from the same level group. 
 */
exit: function(self, exitIndex){
    exitIndex = orDefault(exitIndex, 0);
    self.levelGroup.loadLevel(self.exits[exitIndex]); //that will call end() for us
},

/**
 * Returns the tiles in movable range for the animal. The animal can move to any of these tiles this turn.
 * @param {Animal} animal
 * @return {Tile[]} tiles that can legally be stepped on by this animal. 
 */
getMoveTiles: function(self, animal){
    return self.getTilesWithinPrice(animal);    
},

/**
 * Returns the tiles that the animal can attack/interact with, but not move to this turn.
 * These tiles are just beyond the range of tiles the animal can move to, or they're occupied by something.
 * @param {Animal} animal
 * @param {Tile[]} moveTiles    the result of level.getMoveTiles(animal).
 * @return {Tile[]]}    a list of tiles this animal may attack this turn.
 */
getAttackTiles: function(self, animal, moveTiles){
    moveTiles.add(animal.tile);
    var attackTiles = [];
    moveTiles.forEach(function(tile){
         //we want to stock attackTiles with every tile we can attack... ok if we have dup's
         var oldOkTiles = self.getTilesWithinRadius(tile.coords, animal.range);
         //oldOkTiles = oldOkTiles.subtract(tile).subtract(moveTiles); //remove your own tile and the move tiles
         
         //deep clone it - clone each copy
         var okTiles = oldOkTiles.map(function(ok){ return Object.clone(ok); });
         
         //tell each tile that THIS tile is the one to step over to get to them
         okTiles.forEach(function(ok){
            ok.associatedTile = tile;
         });
         
         attackTiles.add(okTiles);
    });
    
    //let's get rid of tiles we could move on... remember that  attackTiles contains CLONES of the normal tile. So we have to match by coords.
    var moveCoords = moveTiles.map('coords');
    attackTiles = attackTiles.filter(function(tile){
     //ok if tile doesn't match moveTiles's coords
     return moveCoords.indexOf(tile.coords) == -1;  
    });
    
    //now remove duplicates. but it isn't that easy. for each tile that occurs more than once,
    //prefer the one that has the greatest distance between it and associated tile.
    //essentially, prefer tiles that extend to max range
    
    var newAttackTiles = []; //used later
    
    //remove anything that fell through the cracks
    var attackTilesGrouped = attackTiles.groupBy('coords'); //{ coords1: Tile[], coords2: Tile[], ... }
    //console.log(attackTilesGrouped[new Coords(3,3)]);
    //compare each; keep the one from each group that has most distance to associated tile
    Object.keys(attackTilesGrouped, function(coords, group){
        //coords = Coords. it's the key
        //group = Tile[]. contains some # of tiles, each representing a different way of getting there (different associated tile.)
        var rangiestTiles = group.max(function(tile){
            return tile.distanceTo(tile.associatedTile);
        });
        //rangiestTiles contains an array of all tiles that have the most distance to their associated tiles
        //pretty much, the tiles that extend the animal to their max attack range
        //consolidate these rangiest tiles into one big array of good attack tiles (that extend you)
        newAttackTiles.add(rangiestTiles); //this auto-flattens
    });
    
    //newAttackTiles contains each tile in our range, with the best associated tile (the one farthest from tile itself)
    //but it contains CLONES of the real tiles; let's find the proper tiles
    var fixedAttackTiles = newAttackTiles.map(function(tile){
        //look up by coords
        var properTile = self.getTile(tile.coords);
        //copy the associated tile
        properTile.associatedTile = tile.associatedTile;
        return properTile;        
    });
    
    return fixedAttackTiles;
},

/**
 * Returns all tiles that the animal can move to or attack this turn.
 * @param {Animal} animal
 * @return {Tile[]} move and attack tiles smooshed together. This should have no duplicates
 */
getTilesInRange: function(self, animal){
    var moveTiles = self.getMoveTiles(animal);
    var attackTiles = self.getAttackTiles(animal, moveTiles);
    var tilesInRange = moveTiles.add(attackTiles).unique().remove(animal.tile);
    
    return tilesInRange;
},

/**
 * Asks the user to select a tile from the given list. The tiles will be highlighted, and the user will click.
 * @param {Tile[]} possibleTiles    a flat (1D) array of tiles the user can choose. They must be in this level. 
 * @param {String} colorClass   A class to color the tiles to highlight. ("move", "attack", "item")"-highlight".
 * @param {function} callback   a function that will be called when the tile is clicked. The Tile itself will be passed as a param.
 */
requestTile: function(self, possibleTiles, colorClass, callback){
    possibleTiles.forEach(function(tile){
       tile.setHighlight(colorClass, function(tile){
            //clear all highlights
            self.clearHighlights();
            //callback with the tile as parameter
            callback(tile);
        })
    });
},

/**
 * Tells each tile in this level to unhighlight itself. 
 */
clearHighlights: function(self){
    self.getTileList().forEach(function(tile){
        tile.unhighlight();    
    });
},

//<TODO>: getPathTo
getPathTo: function(self, viewer, tile){
    //reduce to prices and A* pathfind to get path to it
    var priceMatrix = self.reduceTilesToPrices(viewer); //[[1, 0], [2, 3], [4, 6], ... ]
    var graph = new Graph(priceMatrix);
    var start = graph.nodes[viewer.getY()][viewer.getX()]; //start node, where user is
    var end = graph.nodes[tile.getY()][tile.getX()]; //where destination tile is
    
    var path = astar.search(graph.nodes, start, end); //contains coords of each tile to step on to get there
    
    //<TODO>: finish   
    console.log(path); 
    return graph;    
},

/**
 * For the given animal, finds all the tiles that are within the animal's walking range.
 * @param {Animal} viewer   the animal to find tiles for
 * @return {Tile[]} a list of all tiles that the user can walk to this turn. 
 */
getTilesWithinPrice: function(self, viewer){
     /**
      * TODO edit this
      * We should have separate function that will make a path for just one tile
      *   Use the chunk within the double for's as another function
      * Then in tile.getPathTo(viewer), it can dynamically generate a path to it for the viewer (assuming it's in range)
      *   or use level.getPathToTile(tile, viewer) 
      */
    //convert tiles to costs
    var priceMatrix = self.reduceTilesToPrices(viewer); //[[1, 0], [2, 3], [4, 6], ... ]
    //for each of our tiles, ask if it's in range
    //that is, find the optimum route there and see if the cost is still low enough
    var graph = new Graph(priceMatrix);
    var start = graph.nodes[viewer.getY()][viewer.getX()]; //start node, where user is
    var tilesInRange = [];
    for(var r=0; r<self.numRows(); r++){
        for(var c=0; c<self.numCols(); c++){
            var end = graph.nodes[r][c]; //this tile
            var path = astar.search(graph.nodes, start, end);
            if(!path || path.length == 0) continue; //not possible to get there
            //path contains list of nodes with .x and .y
            //calculate total price
            var totalPrice = 0;
            for(var i=0; i<path.length; i++){
                var price = priceMatrix[path[i].x][path[i].y]; //yeah they flip x and y
                //if(price === undefined)alert(path[i].x + "," + path[i].y);
                totalPrice += price;
            }
            if(totalPrice <= viewer.getSpeed()){
                //it's in range!
                var tile = self.tiles[r][c];
                tilesInRange.push(tile);
                tile.setPathTo(path); //cache it
            }
        }
    }
    
    return tilesInRange;
},
 
getPathTo: function(self, viewer, tile){
     //TODO DRY, combine with getTilesWithinPrice
     
    //basically, get the optimum route toward that tile, then keep cutting down tiles until you're under price 
    var priceMatrix = self.reduceTilesToPrices(viewer); //[[1, 0], [2, 3], [4, 6], ... ]
    var graph = new Graph(priceMatrix);
    var start = graph.nodes[viewer.getY()][viewer.getX()]; //start node, where viewer is
    var end = graph.nodes[tile.getY()][tile.getX()];
     var path = astar.search(graph.nodes, start, end);
     if (!path || path.length == 0) return null; //not possible to get there
     //path contains list of nodes with .x and .y
     
     var calculatePrice = function(path){
          var totalPrice = 0;
          for (var i = 0; i < path.length; i++) {
               var price = priceMatrix[path[i].x][path[i].y]; //yeah they flip x and y
               totalPrice += price;
          }   
          return totalPrice;       
     };
     
     if(calculatePrice(path) <= viewer.getSpeed){
          //path, as it is, is OK
          return path;
     }
     //didn't work; need to cut down until you're under
     while(calculatePrice(path) > viewer.getSpeed()){
          path.pop(); //get rid of last tile
     }
     //finally it's under!
     return path;
},   

/**
 * Based on the viewer's price values for a tile, creates and returns an int matrix containing the prices of each tile, from the viewer's point of view.
 * @param {Animal} viewer   an animal to determine the price of each tile
 * @return {int[][]}    an int matrix of the same size as the tile grid, except each tile has been replaced with the appropriate cost.
 */
reduceTilesToPrices: function(self, viewer){
    var priceMatrix = [];
    for(var r=0; r<self.numRows(); r++){
        var array = [];
        for(var c=0; c<self.numCols(); c++){
            var tile = self.tiles[r][c];
            var price = viewer.reduceTileToPrice(tile);
            array.push(price);
        }
        priceMatrix.push(array);
    }  
    
    return priceMatrix;
},

/**
 * Returns a list of all tiles that are within the given radius. Prices of terrain are ignored.
 * The tile at the given coords is not included.
 * @param {Coords} coords   a legal coords
 * @return {Tile[]}
 */
getTilesWithinRadius: function(self, coords, radius){
    var validTiles = [];
    var x = coords.x;
    var y = coords.y;
    for(var r=y-radius; r<=y+radius; r++){
        var a = radius - Math.abs(r - y); //x+-a is range to check in this row
        for(var c=x-a; c<=x+a; c++){
            var tile = self.getTile(new Coords(c,r));
            if(tile)
                validTiles.push(tile);
        }
    }
    return validTiles;
},

/**
 * Returns all tiles that pass a given test. Use this to select tiles that are a certain distance away, etc.
 * @param {function(Tile) : boolean}    filterFunction this will be called on every tile in the level. Return true if it fits your criteria.
 * @return {Tile[]} all tiles that fit the filterFunction. 
 */
getTilesSuchThat: function(self, filterFunction){
     return self.getTileList().filter(filterFunction);
},

/**
 * Chooses one tile from the given list that is totally unoccupied. Additionally, the viewer must be able to step onto the tile's terrain (based on certain "reasonable" rules).
 * If multiple tiles are unoccupied, it isn't guaranteed which will be returned.
 * @param {Actor} viewer   the actor who is searching for a tile.
 * @param {Tile[]} tiles    a list of tiles in this level.
 * @return {Tile} some empty tile from the list, or null if all are occupied.
 */
getEmptyTile: function(self, viewer, tiles){
    for(var i=0; i<tiles.length; i++){
        var tile = tiles[i];
        var canStep = true;
        
        //anyone there?
        //we can be selective - if there's ANYTHING at all there, skip
        if(tile.contents.length > 0) canStep = false;
        /*tile.forEachContents(function(actor){
            if(actor instanceof Animal
            || actor instanceof NPC
            || actor instanceof Obstacle) 
                canStep = false;
        });*/
        
        //terrain? check the classically-unsteppable terrain types
        if(IMPASSABLE_BGS.indexOf(tile.background) != -1) canStep = false;
        
        if(canStep) return tile;
    }    
    return null;
},

/**
 * Returns the closest unoccupied tile to the viewer.
 * @param {Actor} viewer
 */
getClosestEmptyTile: function(self, viewer){
     if(!viewer) return;
    for(var radius=0; radius<10; radius++){
        //grab tiles in this radius, see if any are empty
        var emptyTile = self.getEmptyTile(viewer, self.getTilesWithinRadius(viewer.tile.coords, radius));
        if(emptyTile) return emptyTile;
        //otherwise try again
    }
    //seriously, no dice?
    return null;
} 
    
});
