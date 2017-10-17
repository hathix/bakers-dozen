var NPC = new Class({
   
__extends__: Actor,

/**
 * Creates an NPC (non-player character), whose main duty is to talk to the main character.
 * @param {String} type what type of animal this NPC is.
 * @param {String} name the name of this NPC.
 * @param {function(NPC, Ally, Flags) : Conversation} conversationFunction will be called when interacted with to ask for a conversation. You're given the Flags of the current level, yourself (self) and the speaker (the main character) themselves. Use this info in a switch/case to determine which Conversation to return.
 * @param {function} onConversationFinish   [optional] a function with no args/return that will be called once your conversation is over. Handle anything like moving or giving the player something here.
 * @param {Object} optionalAttrs    [optional]
 */
__init__: function(self, type, name, conversationFunction, onConversationFinish, optionalAttrs){
    Class.ancestor(NPC, '__init__', self, type, name, "animals", DIALOGUE_TYPES.neutral, optionalAttrs);
    self.conversationFunction = conversationFunction;
    self.onConversationFinish = orDefault(onConversationFinish, $.noop); //either that or an empty function
    
    //npcs may use these...
    self.satisfied = false;
    
    
    //show popover when near
    self.div.tooltip({
        title:      self.name,
        trigger:    'hover'          
    });
    /*
    self.div.qtip({
        content: {
            text: self.name
        },
        position: {
            my: "bottom center",
            at: "top center"
        },
        style: {
            classes: "ui-tooltip-shadow ui-tooltip-blue"
        }
    });
    */
},

interactedWith: function(self, speaker){
    //show dialogues
    var conversation = self.conversationFunction(self, speaker, level.flags);
    level.startConversation(conversation);    
}    
    
});
