var Team = new Class({
     
/**
 * 
 * @param {String} name       The team name.  
 * @param {String} formalName What to call the team in the UI.
 * @param {String} cssClass   The class to apply to the team's divs. Usually for BG's.
 * @param {Ally[]} animals    the animals that are on this team. They must be fully init'ed.
 */
__init__: function(self, name, formalName, cssClass, animals){
     self.name = name;
     self.animals = orDefault(animals, []);
     self.formalName = formalName;
     self.cssClass = cssClass;
     
     self.fog = []; //Tile[]
},

/**
 * Adds many animals to the team. 
 */
addAnimals: function(self, animals){
     animals.forEach(function(animal){
          self.addAnimal(animal);
     });
},

addAnimal: function(self, animal){
     self.animals.add(animal);
     animal.addedToTeam(self);
},

removeAnimal: function(self, animal){
     self.animals = self.animals.subtract(animal);
},

/**
 * Returns true if all animals in this team are dead. 
 */
isDefeated: function(self){
     return self.animals.length == 0;
},

/*
 * Call this after you load the team. It tells all the animals that we own them.
 */
readyAnimals: function(self){
     //tell animals
     self.animals.forEach(function(animal){
          animal.addedToTeam(self);
     })
},

/**
 * Prepares the fog of war for this team. Call @ start of level.
 * @param {Tile[]} tiles a list of tiles. Use level.getTileList().
 */
loadFog: function(self, tiles){
     self.fog = tiles;
},

displayFog: function(self){
     //places a fog over the battlefield; put it on each tile
     self.fog.forEach(function(fogTile){
          //put fog in that tile
          var fog = new Steppable("Fog");
          fogTile.addContents(fog);     
     });   
},

/**
 * Gets rid of all fog around the given tile.
 * @param {Tile} tile    which tile to clear around.
 * @param {int} radius   how far around to clear.
 */
dispelFog: function(self, tile, radius){
     self.fog = self.fog.filter(function(fogTile){
          if(fogTile.distanceTo(tile) <= radius){
               //dispel this fog; that is, don't put it back in
               return false;
          }
          else{
               //keep it
               return true;
          }
     });
}

});
