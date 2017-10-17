/**
 * Contains info on the base stats of each animal.
 * API:
 *  Stats get(String type)
 * 
 * A Stats object consists of the following base stats.
 *  int attack
 *  int defense
 *  int hp
 *  int speed
 */
var statDB = new Singleton({
     
__init__: function(self){
     
    //attack, defense, hp are usually on scale of 0-100
    //speed is usually 2-6
    //terrain costs: (in BG_TYPES's order)
    /* alpine, brick, bridge ew, bridge ns, concrete, dirt,
    dirt tile, empty, fairway, forest, grass, haunted,
    ice, lava, mud, path, red carpet, road, sand, sand light, sand soft,
    savannah, snow, swamp, tile, water, water green, water shallow, wood
    */      
    
     var Stats = self.defineStats();              
         
     self.database = {
          //terrain costs normal:              "01111220111120211121112210221"
          //                                   "aBbbcdDeFfghilmpRrSSSssstwwwW"
        //"Default":     new Stats(at,de,hp,speed, terrainCosts,              , abilityName),   
        //"Template":    new Stats(00,00,00,5, "01111220111120211121112210221", "name"),
          "Bat":         new Stats(30,45,50,5, "01111110111110111111111115111", "Vampire"),
          "Bear":        new Stats(60,55,45,4, "01111220111120211121112210221", "Resistant"),
          "Bee":         new Stats(55,40,50,6, "01111110111120211111111110331", "Sting"),
          "Brown Lion":  new Stats(55,40,45,6, "01111320111130311111113210211", "Pride"),
          "Cow":         new Stats(40,55,65,5, "01111110111120111132213310331", "Medic"),
          "Chicken":     new Stats(40,50,60,5, "01111120111120111121112210211", "Substitute"),
          "Crab":        new Stats(60,45,45,4, "01111220121120111121112314111", "Sniper"),
          "Duck":        new Stats(35,40,30,4, "01111220111110111121112210111", "Quack"),
          "Hamster":     new Stats(45,45,60,6, "01111330111120311121112210221", "Generator"),
          "Elephant":    new Stats(55,50,55,5, "01111220111120211121112210221", "Clutch"),
          "Fox":         new Stats(50,45,55,6, "01111220111120211121112210221", "Brave"),
          "Gnu":         new Stats(50,60,50,6, "01111220111120211121112210221", "Herd"),
          "Hedgehog":    new Stats(45,45,60,5, "01111110111130211131112210221", "SpikySkin"),
          "Horse":       new Stats(60,55,25,6, "01112110121130111222112110311", "Knight"),
          "Leopard":     new Stats(55,45,35,7, "01111220111120211121112210221", "Reflex"),
          "Llama":       new Stats(35,60,65,5, "01111110111140211111111310321", "PowerSwap"),
          "Lobster":     new Stats(45,60,45,5, "01111220121120111121112314111", "Molt"),
          "Monkey":      new Stats(65,45,40,7, "01111110111130211121112210221", "Bananarama"),
          "Ostrich":     new Stats(50,55,45,4, "01111220111120211121112210221", "EggCannon"),
          "Owl":         new Stats(50,50,50,5, "01111110111110111111111113111", "Roost"),
          "Panda":       new Stats(40,45,55,6, "01111220111120211121112210221", "Bamboomerang"),
          "Polar Bear":  new Stats(55,65,35,4, "01111120121110211132111210321", "Mist"),
          "Red Squirrel":new Stats(50,45,65,6, "01111220111120211121112210221", "StealthAcorn"),
          "Squirrel":    new Stats(45,50,60,5, "01111220111120211121112210221", "Dire"),
          "T-Rex":       new Stats(75,30,45,5, "01111110111120211121113110121", "Kamikaze"),
          "Turkey":      new Stats(45,45,55,4, "01111120111120111121112210211", "Warp"),
          "Yellow Lion": new Stats(60,45,45,5, "01111320111130311111113210211", "FleetFoot"),
     };
},

/**
 * Returns the base stats of an animal.
 * @param {String} type what type of animal it is. The first letter should be capitalized.
 * @return {Stats} the stats object. See comment at top for information about it.
 */
get: function(self, type){
     return self.database[type];
},

/**
 * Returns a database containing ALL animal stats. The database is in this format:
 * {
 *      "animalName": Stats: { attack, defense, hp, speed, terrainCosts, abilityName }
 * }
 */
getAllStats: function(self){
     return self.database;     
},


defineStats: function(self){     
     /**
      * Contains base stat info for an animal.
      * For terrainCosts, pass a string containing the ints for movement cost, in BG_TYPES's order.
      * Contents:
      *  int attack
      *  int defense
      *  int hp
      *  int speed
      *  int[] terrainCosts - is in the same order that backgroundConverter specifies. 
      *  String abilityName - converted to an Ability object.
      */
     var Stats = function(attack, defense, hp, speed, terrainCosts, abilityName){
        this.attack = attack;
        this.defense = defense;
        this.hp = hp;
        this.speed = speed;
        
        //terrain costs
        var costArray = [];
        //fill with int-cast versions of each string in the terrain costs
        terrainCosts.split("").forEach(function(str){
            costArray.push(parseInt(str));
        });
        this.terrainCosts = costArray;
        
        //abilityName
        this.ability = abilityDB.get(abilityName);
     };    
     
     return Stats;
}

});