chapterList.add(0, function(){
    
    
//shorthand constructors (save space)
var C = Coords; //so call new C(x,y)
var E = Enemy;
var I = Item;
var N = NPC;
var O = Obstacle;
var S = Steppable;

var levelGroups = [
new LevelGroup(
    0,
    "Home",
    LevelGroupEnums.types.TOWN,
    [],
    [
    function(){
        return new BattleLevel(
            //rawTiles:
            [ 
            [ ["W"], ["W"], ["W"], ["W"] ],
            [ ["W"], ["W"], ["W"], ["W", new S("Wood Stairs Down", 0)] ],
            [ ["W"], ["W"], ["W"], ["W"] ],
            [ ["W"], ["W"], ["W"], ["W"] ]
            ],
            //allyLocations:
            [new C(1,1), new C(1,2)]
            ,
            //background:
            "W"
            ,
            //exits:
            ["+1"]
        )        
    },
    function(){
        return new BattleLevel(
            //rawTiles:
            [ 
            [ ["W"], ["W", new O("Bookshelf", "Lollipop Mint")], ["W"], ["W"] ],
            [ ["W"], ["W"], ["W"], ["W", new S("Wood Stairs Up", 0)] ],
            [ ["W"], ["W"], ["W"], ["W"] ],
            [ ["W", new S("Door", 1)], ["W"], ["W"], ["W"] ]
            ],
            //allyLocations:
            [new C(3,1)]
            ,
            //background:
            "g"
            ,
            //exits:
            ["-1", LevelTypes.EXIT]
        )            
    }
    
    ]        
),
new LevelGroup(
    1,
    "Demo",
    LevelGroupEnums.types.BATTLE,
    [],
    [
    function(){
        //init anything complicated here
        var npc = new NPC("Fox","Spy Fox", function(self, them, flags){
            if(self.satisfied){
                //already got ice cream!
                return new Conversation([
                    self.dialogue("Hey, thanks for that ice cream. Have a nice day now.")
                    ]
                );
            }
            
            if(world.hasInInventory("IceCream Orange")){
                return new Conversation([
                    self.dialogue("Ah, you got my ice cream! Most excellent. I'll just take that off your hands. And here's a little something for your trouble.")
                    ],
                    
                    function(self){
                        //take away ice cream, give gift
                        world.removeFromInventory("IceCream Orange");
                        world.addToInventory("Heart Full");
                        self.satisfied = true;
                        self.scoot(); //walk away
                    }, self
                );
            }
            
            //no ice cream!
            return new Conversation([
                self.dialogue("Where's my ice cream, huh?")
                ]
            );   
        });
        
        var npc2 = new NPC("Bird", "Agent Aquila", function(self, them, flags){
            return new Conversation([
                self.dialogue("Psst... take this. You may need it. Agent Aquila, out.")    
                ],
                
                function(self){
                    world.addToInventory("Pill");
                    self.removeFromView();
                    character.monologue("One dehydrated bridge. Just add water. How handy.");
                }, self
            );  
        });     
          
        return new BattleLevel(
            //rawTiles:
            [ [ ["g"],["g", npc2] ],
              [ ["w", ["bridgeable"]],["w", ["bridgeable"]] ],
              [ ["B"],["t", new E("Bear", {name: "Yogi Bear", dropItem: new I("Gift"), dropChance: 1})] ],
              [ ["B", ],["g", new I("IceCream Orange")] ],
              [ ["B"],["s", npc] ],
              [ ["w"],["s", new S("Door", 0) ] ]  ],
            //allyLocations:
            [new C(0,0)],
            //background:
            "g",
            //exits:
            [LevelTypes.EXIT]
        )        
    }
    ]        
),
new LevelGroup(
    2,
    "Talkie",
    LevelGroupEnums.types.BATTLE, 
    [], //prereqs
    [
    function(){
        return new BattleLevel(
        //rawTiles:
        [ 
        [ ["ws"], ["ws"], ["g"], ["g"] ],
        [ ["ws"], ["g", new S("Acorn", {type: "Ally", damage: 5})], ["g"], ["g"] ],
        [ ["f"], ["f"], ["w"], ["g", new S("Flag", 0)] ],
        [ ["f"], ["f"], ["g"], ["g", new E("Bear")] ]
        ],
        //allyLocations:
        [new C(1,2)]
        ,
        //background:
        "g"
        ,
        //exits:
        ['+1']   
    )},
    function(){
         var sign = new O("Sign", function(self, actor){ return new Conversation([
             self.dialogue("Yes We Can! (Read Signs)")    
         ])});
         
         npc = new NPC("Walrus", "Guard", function(self, them, flags){
             if(self.satisfied){
                 return new Conversation([
                     self.dialogue("Hey, thanks for the &mdash; I mean, do I know you? Er, you didn't see me see you see me. Er.")
                 ]);  
             }
             else if(world.hasInInventory("Money Bag")){
                 return new Conversation([
                     self.dialogue("You're not getting through, kid. And there's nothing you could say - or do - to make me let you through."),
                     them.dialogue("Even this money bag?"),
                     self.dialogue("Besides that.")
                     ],
                     
                     function(self){
                         world.removeFromInventory("Money Bag");
                         self.satisfied = true;
                         self.scoot();
                         character.monologue("Bribing corrupt guards is something only we secret agents do, and then, only when we're on a case.");
                     }, self);
             }
             else{
                 return new Conversation([
                     self.dialogue("Where do you think YOU'RE going, kid? Don't you know you need ID?"),
                     them.dialogue("As it so happens, I seem to have left it inside. Now if you wouldn't mind..."),
                     self.dialogue("Yeah right, kid. Nice try.")
                     ],
                     
                     function(main){
                         main.scoot();
                         main.monologue("I need to find some way to get an ID card. Or, bribe him.");   
                     }, them);
             }  
         });
         
         return new BattleLevel(
             //rawTiles:
             [ [ ["B"],["s", new Steppable("Pressure Pad Up", sign)] ],
               [ ["w", sign],["g"] ], 
               [ ["B"],["g"] ],
               [ ["B", new I("Money Bag")],["g"] ],
               [ ["ws"],["ws", npc] ],
               [ ["e"], ["g", new S("Flag", 0)] ]
               ],
             //allyLocations:
             [new C(0,0)],
             //background:
             "w",
             //exits:
             ["+1"]
         );         
    }
    ]
),
new LevelGroup(
    3,
    "Sample Fighter",
    LevelGroupEnums.types.BATTLE, 
    [],
    [
    function(){
        return new BattleLevel(
        //rawTiles:
        [ 
        [ ["s"], ["s"], ["s"], ["s"] ],
        [ ["s"], ["i", new E("Bear")], ["i"], ["s", new E("T-Rex")] ],
        [ ["s"], ["i"], ["i"], ["s", new S("Flag", 0)] ],
        [ ["s"], ["s"], ["s", new E("Bear")], ["s"] ]
        ],
        //allyLocations:
        [new C(0,0), new C(0,1)]
        ,
        //background:
        "s"
        ,
        //exits:
        [LevelTypes.EXIT]   
    )}
    ]
),
];
    
var overworldLevel = new OverworldLevel(
        //rawTiles:
        [ [ ["g"],["e"], ["g", new S("Overworld Flag", 3)],["g", new S("Overworld Flag", 0)] ],
          [ ["g"],["g"], ["g"],["g"] ],
          [ ["g", [new S("Tower"), new S("Overworld Flag", 2)]],["g"], ["g"],["g", new S("Overworld Flag", 1)] ],
          [ ["g"],["e"], ["e"],["e"] ]],
          
        //allyLocation:
        new C(0,0),
        //background:
        "w"
);

return new Chapter(0, "From Humble Beginnings", overworldLevel, levelGroups);

});
