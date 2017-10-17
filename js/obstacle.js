/**
 * EXTENDS ACTOR.
 * A stationary actor that can't move, be moved onto, interact, or be interacted with.
 * Essentially decoration.
 */
var Obstacle = new Class({

__extends__: Actor,

__init__: function(self, type, data, optionalAttrs){
    Class.ancestor(Obstacle, '__init__', self, type, type, "grid-objects", DIALOGUE_TYPES.sign, optionalAttrs);
    
    self.data = data;       
     
    //merge in custom stuff from the database
    var cobrafied = cobraWrap(self, obstacleDB[type]);
    $.extend(self, cobrafied);    
},

/**
 * Returns true if this obstacle specified an interaction function, false if it didn't.
 * The default interaction function is nothing. 
 */
canBeInteractedWith: function(self, actor){
    //if it's in the obstacle DB...
    return obstacleDB.hasOwnProperty(self.type);   
},

//implement interactedWith
interactedWith: function(self, actor){ return false; }//DEFAULT!

});

/**
 * Hassle-free database for Obstacles.
 * The code associated with a type will be merged into the main Steppable object. 
 * See above each type for the requirements for what data is.
 * 
 * Specify:
 * void interactedWith(Actor): called when the actor interacts with you.
 */
var obstacleDB = {
    
    "Sign": {
         __data: "either: function(self, actor): returns Conversation to start / {String} one line to say",
        interactedWith: function(self, actor){
             if(typeof self.data == "string")
               self.monologue(self.data);
            else
               level.startConversation(self.data(self, actor));
        }    
    },    
    
    //This is used for a 1-time object pickup.
    "Bookshelf": {
         __data: "item to pick up",
        //TODO: make an automatic "used" feature so that anything that's used once can't be used again; change this to interact and have wrapped interactedwith
        used: false,
        interactedWith: function(self, actor){
            if(!self.used){
                actor.monologue("That's an interesting thing to keep in a bookshelf, but OK!")
                world.addToInventory(self.data);
                self.used = true;
            }
            else{
                actor.monologue("Nothing's here...");
            }
        }            
    }
};
