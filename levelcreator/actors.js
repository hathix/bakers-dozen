/**
 * Designing the actors (obstacles, steppables, items) of the level.
 */

var selectedActorFunc = null;
//call this to get the selected actor
var selectedActor = null;

function startActorSelection() {

     $('.actor-menu').empty();

     //obstacles
     Object.each(obstacleDB, function(key, value) {
          //we only really care about the key... put a photo in of it
          var obs = new Obstacle(key);
          //this is just a junk thing
          var image = obs.image;
          image.attr('title', key);
          image.addClass('actor-img');
          image.data('actorFunc', function() {
               return new Obstacle(key);
          });
          $('#obstacle-menu').append(image);
     });
     //steppables
     Object.each(steppableDB, function(key, value) {
          var step = new Steppable(key);
          var image = step.image;
          image.attr('title', key);
          image.addClass('actor-img');
          image.data('actorFunc', function() {
               return new Steppable(key);
          });
          $('#steppable-menu').append(image);
     });
     //items
     Object.each(itemDB, function(key, value) {
          var item = new Item(key);
          var image = item.image;
          image.attr('title', item.description);
          image.addClass('actor-img');
          image.data('actorFunc', function() {
               return new Item(key);
          });
          $('#item-menu').append(image);
     });

     $('.actor-img').oneClick(function() {
          selectedActorFunc = $(this).data('actorFunc');
     });

     tileset.initTileEvents(function(tile) {
          tile.td.oneClick(function(event) {
               selectedActor = selectedActorFunc();
               if (event.altKey) {
                    //chances are they meant to remove what was there... don't add anything
                    return;
               }
               addActor(selectedActor, tile);
          });
     });
}

/**
 * Add the actor to a tile.
 *
 * @param {boolean} update  true if you're UPDATING the actor, false if you're ADDING it for the first time (or omit)
 */
function addActor(actor, tile, update) {
     //get more info about the actor

     var dialog = $('#actor-dialog');
     fillActorDialog(actor);

     function fin() {//put in tile and finish init'ing actor
          actor.putInView(tile);
          //TODO do checking to see if an actor w/ this name already exists
          actor.div.attr('title', actor.varName);
          actor.div.tooltip('destroy').tooltip();
          actor.div.oneClick(function(e) {
               //alt => delete, ctrl => add something else, normal => show dialog
               if (e.altKey) {
                    actor.removeFromView();
               } else if (e.ctrlKey) {
                    selectedActor = selectedActorFunc();
                    addActor(selectedActor, tile);
               } else {
                    //re-show dialog; this same function does this
                    addActor(actor, tile, true);
               }
          });
     }

     //if the actor has no data, we may not want to show it (it's annoying)
     if (isPressed('actor-if-no-data') && !Object.has(actor, '__data') && !update) {
          //skip right to it
          fin();
          return;
     }

     dialog.modal('show');
     $('#actor-dialog').oneBind('hidden', function() {
          //update fields
          //remove what's there at that var name so we can add it again
          actor.varName = orDefault($('#actor-var').val(), "blank");
          while (Object.has(vars, actor.varName)) {
               //won't work!
               actor.varName += "1";
          }
          
          actor.data = orDefault($('#actor-data').val(), "null");
          //NOTE: we're not storing as we should, this is on purpose... read it this way

          fin();
     });

}

function fillActorDialog(actor) {
     var dialog = $('#actor-dialog');
     $('#actor-dialog-label').html(actor.type + " details");

     //actor will be assigned a variable name, which may come in handy when referring to it later
     if (!actor.varName) {
          //make up something random
          actor.varName = actor.name.camelize(false) + Number.random(0, 100);
     }
     $('#actor-var').val(actor.varName);

     //data; they have __data as a hint
     if (!Object.has(actor, '__data')) {
          $('#if-actor-data').hide();
     } else {
          //has data
          $('#if-actor-data').show();
          $('#actor-data-help').html(actor.__data);
          $('#actor-data').val(actor.data);
     }
}
