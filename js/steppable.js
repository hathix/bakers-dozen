var Steppable = new Class({

__extends__: Actor,

/**
 * 
 * @param {String} type what type of steppable this is.
 * @param {Object} data [optional] any data that might be used later, when stepped on. The type and use varies based on what the step function says.
 * @param {Object} optionalAttrs    [optional] Passed to Actor construtor.
 */
__init__: function(self, type, data, optionalAttrs){
    Class.ancestor(self, '__init__', self, type, type, "grid-objects", DIALOGUE_TYPES.sign, optionalAttrs);
    self.div.addClass('steppable');
    
    self.data = data;       
    self.cantStepOn = false; //set =true if you want to manually override this & make the steppable act like an obstacle.
     
    //merge in custom stuff from the database
    var cobrafied = cobraWrap(self, steppableDB[type]);
    $.extend(self, cobrafied);
},

interactedWith: function(self, actor){
    self.steppedOn(actor);
},

steppedOn: function(self, actor){},
steppedOff: function(self, actor){},
init: function(self){}
    
});

/**
 * Reusable code that steppableDB may use. 
 */
var steppableReusable = {
    "Exit": {
         __data: "# of exit to take; this is the INDEX not the actual number!!",
        steppedOn: function(self, stepper){
               bootbox.confirm("Are you sure you want to leave this level?", function(result) {
                    if(result) level.exit(self.data);
               });
        }    
    }
}

/**
 * Hassle-free database for Steppables.
 * The code associated with a type will be merged into the main Steppable object. 
 * See above each type for the requirements for what data is.
 * 
 * Specify:
 * void steppedOn(Actor): called when the actor steps on you.
 * void steppedOff(Actor): called when the actor steps off you.
 */
var steppableDB = {
        
      //<TODO>: add "canStep" field, which returns "Ally", "Enemy", "both"  
        
     "Acorn": {
          __data: "{String tosser, int damage} Tosser: who threw it (team name), anyone else is vulnerable, use 'null' if it's there by default; damage: % of foe's HP to do (50 -> 50%)",
            steppedOn: function(self, stepper){
                if(stepper.team.name != self.data.tosser){
                    //right type
                    //console.log("GOT HIM");
                    stepper.loseHP(self.data.damage / 100 * stepper.getMaxHP());
                    stepper.logDamaged(stepper.name + " was hurt by Stealth Acorn!");
                    self.removeFromView();  
                }
                else{
                    //console.log("NOPE");
                }
            } 
        },   
        
     "Fog": {
          steppedOn: function(self, stepper){
               //ok, so tell that stepper's team to get rid of fog around here
               stepper.dispelFog(self.tile);   
          }, 
     },
        
     "Pressure Pad Up": {
            __data: "Actor this will manipulate (show/hide). Keep reference to it before creating level, and pass it here.",
            steppedOn: function(self, stepper){
                //mark that we've been stepped on
                self.depressed = true;
                //change view
                self.setType("Pressure Pad Down");
                //switch visibility of data, which is the controlled actor
                self.data.switchVisibility();
            },
            
            steppedOff: function(self, stepper){
                //mark that we've been stepped off
                self.depressed = false;
                //change view
                self.setType("Pressure Pad Up");
                //switch visibility of data, which is the controlled actor
                self.data.switchVisibility();                
            }
        },      
        
       
     "Overworld Flag": {
          __data: "//{int} the id/index (same thing) of the level group this controls ",
            initForLevel: function(self){
                //get level group
                var levelGroup = world.chapter.getLevelGroup(self.data);
                //see if this is open, locked, or completed; change its viewabilty if that's the case
                var status = levelGroup.status;
                switch(status){
                    case LevelGroupEnums.statuses.LOCKED:
                        self.cantStepOn = true;
                        self.setType("Overworld Lock");
                        break;
                    case LevelGroupEnums.statuses.OPEN:
                        self.cantStepOn = false;
                        self.setType("Overworld Flag");
                        break;
                    case LevelGroupEnums.statuses.TOWN:
                        self.cantStepOn = false;
                        self.setType("Overworld Town");
                        break;
                    case LevelGroupEnums.statuses.COMPLETED:
                        self.cantStepOn = false;
                        self.setType("Overworld Completed");
                        break;                           
                }
                
                //give a bit of info about this level in a popover
                var popoverDiv = getClonedTemplate('levelgroup-popover-template');
                popoverDiv.find('.levelgroup-status').html(status.description)
                    .removeClass('text-info text-warning text-error text-success muted')
                    .addClass(status.style);
                
                  self.div.popover({
                    title:      levelGroup.name,
                    trigger:    'hover',
                    //placement:  'top',
                    content:    popoverDiv.html(),
                    html:       true   
                  });                  
            },
            steppedOn: function(self, stepper){
                 var levelGroup = world.chapter.getLevelGroup(self.data);
                 var text = sprintf("Are you sure you want to enter <strong>%s</strong>?", levelGroup.name);
                 bootbox.confirm(text, function(result) {
                    if(result) level.exit(self.data); //level is the overworld   
                 });                   
            } 
        },         
        
     /* All that allows you to leave the level.. */   
     //data = # of exit to take
     "Flag": steppableReusable.Exit,
     "Door": steppableReusable.Exit,
     "Wood Stairs Up": steppableReusable.Exit,
     "Wood Stairs Down": steppableReusable.Exit,
        
        /*
     "TEMPLATE": {
            __data: "Something; remove field if no data",
            steppedOn: function(self, stepper){
                
            } 
        }, 
        */        
};
