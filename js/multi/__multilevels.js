var multiLevels = [
     new MultiLevel(
           //name
           "Plains",
           
            //rawTiles
            [ 
            [ ["w"], ["g"], ["g"], ["g"], ["g"], ["g"], ["w"] ],
            [ ["g"], ["w"], ["g"], ["g"], ["g"], ["w"], ["g"] ],
            [ ["g"], ["g"], ["g"], ["g"], ["g"], ["g"], ["g"] ],
            [ ["g"], ["g"], ["g"], ["g"], ["g"], ["g"], ["g"] ],
            [ ["g"], ["g"], ["g"], ["g"], ["g"], ["g"], ["g"] ],
            [ ["g"], ["w"], ["g"], ["g"], ["g"], ["w"], ["g"] ],
            [ ["w"], ["g"], ["g"], ["g"], ["g"], ["g"], ["w"] ],
            ],      
                
            //background
            "g",
            
            //startingLocations
            [
               //1st team
               [ new Coords(1,0), new Coords(2,0), new Coords(3,0), new Coords(4,0), new Coords(5,0) ],
               //2nd team
               [ new Coords(1,6), new Coords(2,6), new Coords(3,6), new Coords(4,6), new Coords(5,6) ],
               //3rd team
               [ new Coords(0,1), new Coords(0,2), new Coords(0,3), new Coords(0,4), new Coords(0,5) ],
               //4th team
               [ new Coords(6,1), new Coords(6,2), new Coords(6,3), new Coords(6,4), new Coords(6,5) ]
            ]
     )
     
];
