var Dialogue = new Class({

/**
 * Creates a new dialogue, or bit of speech an actor can say. 
 * @param {Object} dialogueType  use DIALOGUE_TYPES.[something], based on what overarching kind the speaker is.
 * @param {String} type what species/more specific type the speaker is. This is the name of its picture. 
 * @param {String} name the name of the speaker.
 * @param {String} words    whatever the speaker should say.
 */
__init__: function(self, dialogueType, type, name, words){
    self.dialogueType = dialogueType;
    self.type = type;
    self.name = name;
    self.words = words;
    
    self.noty = null; //notification object
    
    /**
     * TODO: accept an image. if they provide it, put it in the dialogue. or an item in place of the image; if it's an item, just grab its picture URL
     *  * @param {String} image    [optional] if given, the image at this location (relative to /images) will be displayed beneath the words.
     */
}
    
});


var Conversation = new Class({
    
/**
 * @param {Dialogue[]} dialogues   a list of dialogues. Must be in an array.
 * @param {function} finishCallback [optional] a function that will be called once the conversation is done. Will be given the args provided next.
 * @param {Object} finishCallbackArgs [optional] will be passed to the callback
 */
__init__: function(self, dialogues, finishCallback, finishCallbackArgs){
    self.dialogues = dialogues;
    self.currentIndex = 0; //index of current dialogue
    self.finishCallback = finishCallback;
    self.finishCallbackArgs = finishCallbackArgs;
},

/**
 * Starts showing the dialogues contained within this conversation.
 */
start: function(self){
     /*
    //view - show
    $('#dialogue').show();
    //remove the close-only styling from buttons
    $('#dialogue-next').removeClass('close-only');
    $('#dialogue-close').removeClass('close-only');      
    //clicks
    $('#dialogue-next').click(function(){
        self.loadNext();    
    });
    $('#dialogue-close').click(function(){
        level.endConversation(); //instead of handling it here 
    });
    */
    self.loadNext(); //or rather, first
}, 

loadNext: function(self){
    //there's still a dialogue remaining, right?
    if(self.currentIndex >= self.dialogues.length){
        self.end(); //out of dialogues    
        return;
    } 
    
    //close old dialog
    if(self.noty)
     self.noty.close();
        
    //load one into view
    var dialogue = self.dialogues[self.currentIndex];
    //load the stuff into a div and show the HTML of that div (so we're effectively building it from a template)
    var template = getClonedTemplate("dialogue-template");
    template.find(".dialogue-image").attr('src','images/' + dialogue.dialogueType.pictureFolder + "/" + dialogue.type.toLowerCase().dasherize() + ".png");
    template.find(".dialogue-speaker").html(dialogue.name);
    template.find(".dialogue-text").html(dialogue.words);
    var html = template.html();
    
    var buttons = [];
    if(self.currentIndex < self.dialogues.length - 1){
         //add a "next" button only if there's a next dialog
         buttons.add(
          {addClass: 'btn btn-primary', text: 'Next', onClick:
          function($noty){self.loadNext();}
          });
    }
    buttons.add({addClass: 'btn btn-danger', text: 'Close', onClick:
     function($noty){level.endConversation();}});
    
    self.noty = noty({
     text: html,
     layout: 'bottomCenter',
     type: dialogue.dialogueType.cssClass,
     animation: {
          open: {height: 'toggle'},
          close: {height: 'toggle'},
          easing: 'swing',
          speed: 250 //default 500
     },
     buttons: buttons     
    });
    /*
    $('#dialogue').addClass(dialogue.dialogueType.cssClass);
    $('#dialogue-text').html(dialogue.words);
    $('#dialogue-image').attr('src','images/' + dialogue.dialogueType.pictureFolder + "/" + dialogue.type.toLowerCase().dasherize() + ".png");
    $('#dialogue-speaker').html(dialogue.name);
    */
    //increase index
    self.currentIndex++;
    /*
    //if there are no more dialogues left, show ONLY the close button and have it expand
    if(self.currentIndex >= self.dialogues.length){
        $('#dialogue-next').addClass('close-only');
        $('#dialogue-close').addClass('close-only');
    }
    */
},

//<TODO>: if a second conversation is started, this one automatically exits; or if the user move, it exits

end: function(self){
     /*
    //view - hide
    $('#dialogue').hide();
    //undo clicks
    $('#dialogue-next').unbind('click');
    $('#dialogue-close').unbind('click');  
    */
   
   if(self.noty)
     self.noty.close();
    
    //call callback
    if(self.finishCallback){
        var func = self.finishCallback;
        func(self.finishCallbackArgs);
    }
}
    
})