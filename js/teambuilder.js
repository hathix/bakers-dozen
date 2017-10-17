var TeamBuilder = new Singleton({
     
__init__: function(self){
     self.buildTeamTypes = []; //list of animal types (species) in team being built
     
     self.updateTeamList();
},

start: function(self){
     //get ready!
     $('#team-builder').show(500);
     self.initAddTeam(); 
},

initAddTeam: function(self, team){
     //clear table
     var table = $('#add-team-table');
     table.find('tbody').find('tr').remove();
     $('#add-team-member').oneClick(function(){
          self.openAnimalChooseDialog();     
     });
     $('#create-team').oneClick(function(){
          self.createTeam();
     });
     /*
     var masterRow = getClonedTemplate('add-team-member-template');
     for(var i=0; i<TEAM_SIZE; i++){
          var row = masterRow.clone();
          
          row.find('.animal-choose').oneClick(function(){
               self.openAnimalChooseDialog(row);
          });
          
          table.find('tbody').append(row);
     }
     */
    
    self.buildTeamTypes = [];
    self.updateTeamTypes();
},

/**
 * Call this whenever you add/remove animals from buildTeamTypes. 
 */
updateTeamTypes: function(self){
     var numTeammates = self.buildTeamTypes.length;
     //if there's now 5 people on team, disable "add" button; if less, enable
     var button = $('#add-team-member');
     if(numTeammates == TEAM_SIZE){
          button.attr('disabled','disabled');
     }
     else{
          button.removeAttr('disabled');
     }     
     
     //if there's no one on team, disable 'create' button
     button = $('#create-team');
     if(numTeammates == 0){
          button.attr('disabled','disabled');
     }
     else{
          button.removeAttr('disabled');
     } 
},

openAnimalChooseDialog: function(self){
     $('#animal-choose-dialog').modal('show');
     
     $('#animal-info').hide();     
     
     //fill up top with animals
     var list = $('#animal-list');
     list.empty();
     var db = statDB.getAllStats();
     Object.keys(db, function(animalType, stats){
          //get image for animal
          
          //WAIT! if we've already added this animal, prevent adding 2 of the same kind
          if(self.buildTeamTypes.indexOf(animalType) != -1){
               return;
          }
          
          //TODO hook this up to Actor.getPictureURL() so DRY
          var imageURL = "images/animals/" + animalType.toLowerCase().dasherize() + ".png";
          var img = $('<img></img>').attr('src',imageURL);
          img.oneClick(function(){
               self.updateAnimalStatView(animalType, stats);
               $('#choose-animal').oneClick(function(){
                    self.addAnimal(animalType);
               });
               
               //remove shading from other images, make this one shaded
               $('#animal-list').find('.chosen').removeClass('chosen');
               img.addClass('chosen');
          })
          
          list.append(img);
     });  
     
     //update with the 1st available animal; i.e. click on the 1st thing in the list
     list.find('img')[0].click();
},

/**
 * Called when the user clicks on an animal and asks to see their stats.
 * This should ONLY handle the view.
 * Updates the bars showing the given animal's stats (high stats -> large bars, low stats -> short bars).
 * @param {String} animalType the animal's species (e.g. elephant).
 * @param {Stats} animalStats a stats object, containing attack, defense, hp, and so on.
 */
updateAnimalStatView: function(self, animalType, animalStats){
     $('#animal-info').show();
     
     //for each stat, update that bar
     var statArea = $('#animal-stats');
     var stats = {
          attack: animalStats.attack,
          defense: animalStats.defense,
          hp: animalStats.hp,
          speed: animalStats.speed
     };
     
     Object.keys(stats, function(statName, value){
          //update #stats-{key} so its length corresponds to the stat
          var min, max;
          if(statName == 'speed'){
               min = MIN_SPEED;
               max = MAX_SPEED;
          }
          else{
               min = MIN_BASE_STAT;
               max = MAX_BASE_STAT;
          }
          var percentile = (value - min) / (max - min); //0 -> 100 with 20->0th percentile and 80->100th (1) percentile; this in decimal form
          var hundredPercentile = (percentile * 100).round(); //in 0->100 form
          var row = statArea.find('#stats-' + statName); //contains bar & info about each stat
          row.find('.hp-bar').css('width', hundredPercentile + '%');
          
          //TODO add speed. operates on a diff scale so you have to change algorithm
     });
     
     $('#animal-ability-name').html(animalStats.ability.name);
     $('#animal-ability-desc').html(animalStats.ability.description);
     
     $('#animal-type').html(animalType);
},

/**
 * Adds an animal of the given type to the team currently being built. 
 * @param {String} type  the animal's type (species.)
 * @param {jQuery} row   the row that we are to update with this animal's info.
 */
addAnimal: function(self, type){
     //update view
     //tack on a new row
     var row = getClonedTemplate('add-team-member-template');
     row.find('.animal-type-text').html(type);
     row.find('.animal-type').find('img').attr('src', "images/animals/" + type.toLowerCase().dasherize() + ".png");
     row.find('.animal-delete').oneClick(function(){
          self.removeAnimal(type, row);     
     });
     row.find('.animal-assign').oneClick(function(){
          self.showAssignDialog(type, row);     
     });
     
     $('#add-team-table').append(row);
     
     //TODO let user see animal stats from button here
     
     //update model
     self.buildTeamTypes.add(type);
     self.updateTeamTypes();
},

/**
 * Loads and shows the dialog in which the user can assign skill points to the animal. 
 */
showAssignDialog: function(self, type, row){
     var dialog = $('#assign-skills-dialog');
     
     $('#assign-dialog-char-name').html(type);
     dialog.find('.text-error').html('');
     //preload everything with row's current evs
     var skillDescriptors = ['attack','defense','hp','speed','ability'];
     if(row.data(skillDescriptors[0]) !== undefined){
          //we prob assigned points before; let's fill in each box
          skillDescriptors.forEach(function(name){
               $('#skills-' + name).val(row.data(name));
          });
     }
     else{
          //just clear it all
          skillDescriptors.forEach(function(name){
               $('#skills-' + name).val(0);
          });          
     };
     
     $('#assign-skills-confirm').oneClick(function(){
          //check that everything is ok
          var numErrors = $('#skill-assignments').find('input:invalid').length; //invalid entries, like "abcd" or "300"
          if(numErrors == 0){
               //get skill points, make sure they add up to <=50
               var skillPoints = skillDescriptors.map(function(name){
                    return $('#skills-' + name).val().toNumber();
               }); //array of all skill points, like 25-0-0-25-0 for someone who invested solely in attack/speed
               var sum = skillPoints.sum();
               if(sum <= MAX_LEVEL){
                    //good! save this data; attr it to the row
                    var htmlArray = [];
                    for(var i=0; i<skillDescriptors.length; i++){
                         row.data(skillDescriptors[i], skillPoints[i]);
                         if(skillPoints[i] > 0){
                              //update view
                              htmlArray.add(sprintf("%s: %d", skillDescriptors[i].capitalize(), skillPoints[i]));
                         }
                    }
                    //update view
                    var html = htmlArray.join('<br>');
                    row.find('.animal-evs').html(html);
                    
                    //close dialog
                    dialog.modal('hide');
               }
               else{
                    //too many skill points
                    dialog.find('.text-error').html(sprintf('You have assigned %d skill points - you can only have a maximum of %d.',sum,MAX_LEVEL));
               }
          }    
          else{
               //bad input
               dialog.find('.text-error').html('Make sure you have only numbers in the proper range in each box.');
          }
     });
     
     
     dialog.modal('show');
},

/**
 * Removes the given animal from the team being built.
 * @param {String} type  the animal type.
 * @param {jQuery} row   the row it's found in
 */
removeAnimal: function(self, type, row){
     row.remove();
     self.buildTeamTypes.remove(type);
     self.updateTeamTypes();
},

/**
 * Creates the team currently being built and saves to memory.
 */
createTeam: function(self){
     var teamName = orIfFalsy($('#team-name').val(), "New team #" + Number.random(1,100));
     var rows = $('#add-team-table').find('tbody').find('tr');
     //for each row, add an animal
     var animals = rows.map(function(){ //jQuery map is diff than sugar map
          var row = $(this);
          var type = row.find('.animal-type-text').html();
          var name = orIfFalsy(row.find('.animal-name-text-field').val(), type);
          var level = MAX_LEVEL;
          
          //evs
          var skillDescriptors = ['attack','defense','hp','speed','ability'];
          var evs = {};
          if(row.data(skillDescriptors[0]) !== undefined){
               //we prob assigned points before; let's fill in each box
               skillDescriptors.forEach(function(name){
                    evs[name] = row.data(name);
               });
          }
          else{
               //just clear it all
               skillDescriptors.forEach(function(name){
                    evs[name] = 0;
               });          
          };
          
          var animal = new Ally(type, name, level, teamName, { evs: evs });
          return animal;
     });
     animals = animals.toArray(); //map returns jQuery obj
     
     var team = new Team(teamName, teamName, "", animals); //formalName = name; css class is set at runtime
     //compress the team into a store-able format
     var compressed = compress(team, ['name',
     { 'animals': function(alreadyCompressed, val){
          //val is an array of each indiv animal. compress each one
          var animalsCompressed = val.map(function(original){
               return compress(original, ['type','name','evs']);
          });
          return animalsCompressed;
     }}]);
     
     TeamDB.add(compressed);
     
     //reset
     self.initAddTeam();
     self.updateTeamList();
},

loadTeams: function(self){
     
     //reload animals
/*
 *                var animalTypes = team.animals.map(function(animal){ return animal.type });
               animalTypes.forEach(function(type){
                    //tack on an image
                    var image = $('<img></img>');
                    image.attr('src','images/animals/' + type.toLowerCase().dasherize() + '.png');
                    row.find('.team-animals').append(image);     
               });
 */     
     self.updateTeamList();
},

updateTeam: function(self){
    //save team
},
    

/**
 * Updates the list of existing teams. Make sure you've saved the team first.
 */
updateTeamList: function(self){
     var table = $('#team-list-table');
     table.find('tbody').empty();
     
     TeamDB.loadFromStorage();
     
     if(!TeamDB.hasTeams()){ 
          //no teams made! hide table
          table.hide();
          return;
     }
     else{
          //teams here!
          table.show();
          TeamDB.getAllTeams().forEach(function(team){
               //no need to uncompress since we can trawl all the info we need right here
               var row = getClonedTemplate('team-list-template');
               row.find('.team-name').html(team.name);
               //row.find('.team-record').html(team.ranking)
               team.animals.forEach(function(animal){
                    //tack on an image
                    var image = $('<img></img>');
                    image.attr('src', animal.getPictureURL());
                    row.find('.team-animals').append(image);    
               });
               
               //TODO handle editing team
               row.find('.team-delete').oneClick(function(){
                    TeamDB.remove(team.name);
                    //row.remove(); //smoother but less reliable
                    self.updateTeamList();
               });
               
               table.find('tbody').append(row);
          });
     }
},
         

});
