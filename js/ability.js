var Ability = new Class({

__init__: function(self, name, description){
    self.name = name;
    self.description = description;
},

/**
 * VIRTUAL 
 */
mergeIn: function(self, animal){},

/**
 * VIRTUAL - override if you want 
 */
getDescription: function(self, animal){
    return self.description;
}
    
});

var InnateAbility = new Class({
    
__extends__: Ability,

__init__: function(self, name, description, code){
    Class.ancestor(InnateAbility, '__init__', self, name, description);
    
    self.code = code;
},

mergeIn: function(self, animal){
    $.extend(animal, cobraWrap(animal, self.code));
}
    
});


var InvokableAbility = new Class({
    
__extends__: Ability,

__init__: function(self, name, description, usesArray, invoke, shouldInvoke, customData){
    Class.ancestor(InvokableAbility, '__init__', self, name, description);
    
    self.usesArray = usesArray;
    self.code = {
        invokeAbility: invoke,
        shouldInvokeAbility: shouldInvoke,
        getMaxAbilityUses: function(self){
            return self.abilityCalc(usesArray[0], usesArray[1]).round();
        },
        abilityUses: 0
    };
    $.extend(self.code, customData); //tack in custom data
},

mergeIn: function(self, animal){
    $.extend(animal, cobraWrap(animal, self.code));
},
    
});


var ActionAbility = new Class({
    
__extends__: Ability,

__init__: function(self, action){
    Class.ancestor(InnateAbility, '__init__', self, action.name, action.description);
    
    self.action = action;
},

mergeIn: function(self, animal){
    animal.actions.push(self.action);
    //in case they do this multiple times, remove dup's
    animal.actions = animal.actions.unique();
}
    
});