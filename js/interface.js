/**
 * Functions for setting up any interface stuff, such as widgets.
 * This may change based on the platform. 
 */


function initClicks() {
    //team info
    $('#ally-dropdown-target').oneClick(function() {
        //update team info
        var dropList = $('#allies-list');
        dropList.empty();

        world.getActiveAllies().forEach(function(ally) {
            //make an LI for them
            var li = getClonedTemplate('ally-display');

            //fill with stuff
            //TODO share code with animal.getPopoverHTML(); this is just a copy
            li.find('.ally-image').attr('src', ally.getPictureURL());
            li.find('.ally-name').html(ally.name);
            //update HP bar width & text
            li.find('.hp-bar').css('width', ally.getHPPercent() + '%');
            li.find('.hp-bar').html(sprintf("%d/%d", ally.currentHP, ally.getMaxHP())); //TODO make this relative to entire bar not just filled part
            //add green/yellow/red coloring
            li.find('.hp-bar').removeClass('bar-success bar-warning bar-danger');
            var hpp = ally.getHPPercent();
            var cssClass;
            if(hpp <= CRIT_HP_BOUNDARY) cssClass = 'bar-danger'; //red
            else if(hpp >= OK_HP_BOUNDARY) cssClass = 'bar-success'; //green
            else cssClass = 'bar-warning'; //yellow
            li.find('.hp-bar').addClass(cssClass);            
            li.find('.stat-level-text').html(ally.level);
            li.find('.stat-attack-text').html(ally.getAttack());
            li.find('.stat-defense-text').html(ally.getDefense());
            
            //handle clicks
            li.oneClick(function(){
               //open modal containing stats & skills for ally
               var modal = $('#ally-dialog');
               
               refreshAllyDialog(ally);
               
               modal.modal(); 
            });

            dropList.append(li);
        });
    });
    
    $('#team-builder-start').oneClick(function(){
         TeamBuilder.start();
    });
}


function refreshAllyDialog(ally) {
     //fill with stuff
     $('#ally-dialog-char-name').html(ally.name);
     $('#ally-dialog-char-type').html(ally.type);
     $('#ally-skill-points-count').html(ally.skillPoints);

     //for each of several EVs, add a row
     $('#ally-skill-point-table').empty();
     
     var updateRow = function(row, type){
          row.find('.skill-point-image').attr('src', sprintf("images/interface/%s.png", type.image));
          row.find('.skill-point-desc').html(type.description);

          var evs = ally.evs[type.name];
          //#evs the ally has for this stat
          var evPercent = Math.round((evs / EV_MAX) * 100);
          row.find('.skill-points-spent').html(evs);
          row.find('.skill-point-bar').css('width', evPercent + '%');
          //row.find('').
          //row.find('').

          //if there are no EVs or you can't spend any, then disable the spending button
          if (ally.skillPoints == 0 || ally.evs[type.name] == EV_MAX) {
               row.find('.skill-point-spend').attr('disabled','disabled');
          }
          else{
               //clicks
               row.find('.skill-point-spend').oneClick(function() {
                    //spend a skill point
                    ally.skillPoints--;
                    ally.evs[type.name]++;
                    
                    //update all else
                    $('#ally-skill-points-count').html(ally.skillPoints);
                    if(ally.skillPoints == 0){
                         //disable other spend buttons
                         row.parent().find('.skill-point-spend').attr('disabled', 'disabled');
                    }
                    
                    updateRow(row, type);
               });
          }          
     }
     
     Object.keys(statTypes, function(key, type) {
          //this is, for example, ATTACK whose name='attack' and image='sword
          var row = getClonedTemplate('skill-point-row');
          updateRow(row, type);
          $('#ally-skill-point-table').append(row);
     });
}



/**
 * Loads the dragouts, which are panels on the sides that can be dragged out to reveal info.
 * They contain slides of information such as your items, the log, etc. 
 */
function initDragouts(){
     /*
    $('.dragout').show();
    
    //clicking drag nub will slide it out or back
    $('.dragout-nub').click(function(){
        //show/hide the parent dragout
        var dragout = $(this).parent();
        var left = parseInt(dragout.css('left'));
        if(left < 0){
            //it's hidden (been dragged left), slide out
            dragout.animate({
                'left': 0    
            });
            //make the nub have in-pointing arrow
            $(this).html('&laquo;');
        }
        else{
            //it's visible, drag out of sight (=width)
            var width = parseInt(dragout.width());
            dragout.animate({
                'left': "-" + width    
            });
            //make the nub have pointing-out arrow
            $(this).html('&raquo;');
        }
    });
    
    //make dragout's content an accordion (vertically stacked tabs)
    /*$('.dragout-content').accordion({
        fillSpace: true,
        collapsible: true    
    });
    
    //TEMPORARY
    $('.dragout-nub').click();
    */
}

function initDialogs(){
    //finding item dialog
    
    $('#item-dialog').modal({ show: false });
    
}
