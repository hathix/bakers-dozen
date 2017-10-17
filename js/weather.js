var Weather = new Class({
     
__init__: function(self, name, imageName, beginText, finishText, functions){
     //These are custom functions. We'll put wrappers around them.
     self.defaults = {
          _onBegin: $.noop,
          _onFinish: $.noop,
          _onRoundStart: $.noop,
          _onRoundEnd: $.noop         
     };
     var fns = Object.merge(self.defaults, functions, true, true);
     $.extend(self, cobraWrap(self, fns));
     self.name = name;
     self.imageName = imageName;
     self.beginText = beginText;
     self.finishText = finishText;
},

onBegin: function(self){
     log(self.beginText, "info");
     
     //whatever's custom
     self._onBegin();   
     
     //update view
     $('#weather-indicator').find('img').attr('src','images/weather/' + self.imageName + '.png');
     $('#weather-indicator').find('span').html(self.name);  
},

onFinish: function(self){
     log(self.finishText, "info");
     
     self._onFinish();
},

onRoundStart: function(self){
     self._onRoundStart();     
},

onRoundEnd: function(self){
  self._onRoundEnd();   
  
  //TODO decide: if weather ends this turn, should its effects still go on? if yes, stay; if no, move this code above self._ and return
  if(pushLuck(WEATHER_END_CHANCE)){
       //end this weather
       level.endWeather(self);
       //that will call .onFinish() for us
  }
},
        
});

/**
 * Easy encapsulation to determine whether or not to start weather. 
 */
var WeatherChances = new Class({
     /**
      * 
 * @param {Object} self
 * @param {Object} chances    contains decimals (0.1 -> 10%) for each of the weather types (see WEATHER_TYPES) enum. Might look like  {Sun: 0.1, Rain: 0.2 }, etc. You'll still need to include stuff if there's no chance (0).
      */
     __init__: function(self, chances){
          self.chances = chances;
          //add "normal" chance... that's whatever's left over
          self.chances.Normal = 1 - Object.sum(self.chances);
     } ,
     
     getWeather: function(self){
          var rand = Math.random();
          //choose something random... keep adding up (stacking chances algorithm)
          var numWeatherTypes = Object.size(self.chances);
          var cumSum = 0;
          var weather = null;
          Object.keys(self.chances, function(name, chance){
               if(weather) return; //already chosen; stop
               
               cumSum += chance;
               //if the cumulative sum beats the rand, that's our guy
               if(cumSum >= rand){
                    weather = weatherDB[name]; 
               }
          });
          if(weather) return weather;
          return weatherDB.Normal; //shouldn't happen but just in case
     }
     
});

var weatherDB = {
     Normal: new Weather(
          "Normal", //name
          "normal", //imageName
          null, //begin
          null, //end
          {
               //functions
               //none
          }   
     ),
     
     Sun: new Weather(
          "Sunny", //name
          "sun", //imageName,
          "The sun began to shine!", //begin
          "The sun faded.", //end
          {
               //functions
               _onBegin: function(self){
                    //add attack boost to everyone
                    var statChange = new StatChange("sun", "attack", "*" + WEATHER_SUN_ATTACK_MULT, FOREVER);
                    level.getAnimals().forEach(function(animal){
                         animal.applyStatChange(statChange);
                    });
               },
               _onFinish: function(self){
                    //get rid of everyone's stat change
                    level.getAnimals().forEach(function(animal){
                         animal.removeStatChange("sun");
                    })
               }
          }   
     ),
     
     Rain: new Weather(
          "Rainy", //name
          "rain", //imageName,
          "A downpour started!", //begin
          "The rain stopped.", //end
          {
               //functions
               _onBegin: function(self){
                    //add attack boost to everyone
                    var statChange = new StatChange("rain", "attack", "*" + WEATHER_RAIN_ATTACK_MULT, FOREVER);
                    level.getAnimals().forEach(function(animal){
                         animal.applyStatChange(statChange);
                    });
               },
               _onFinish: function(self){
                    //get rid of everyone's stat change
                    level.getAnimals().forEach(function(animal){
                         animal.removeStatChange("rain");
                    });
               }
          }   
     ),     
     
     Snow: new Weather(
          "Snow", //name
          "snow", //imageName,
          "Flurries started to fall!", //begin
          "The snow ended.", //end
          {
               //functions
               _onBegin: function(self){
                    //add attack boost to everyone
                    var statChange = new StatChange("snow", "speed", "-" + WEATHER_SNOW_SPEED_DECREASE, FOREVER);
                    level.getAnimals().forEach(function(animal){
                         animal.applyStatChange(statChange);
                    });
               },
               _onFinish: function(self){
                    //get rid of everyone's stat change
                    level.getAnimals().forEach(function(animal){
                         animal.removeStatChange("snow");
                    });
               }
          }   
     ),          
          
     Storm: new Weather(
          "Stormy", //name
          "storm", //imageName,
          "A vicious storm brewed!", //begin
          "The storm blew over.", //end
          {
               //functions
               _onRoundEnd: function(self){
                    //hurt everyone
                    log("The wind and rain hurt everyone!", "bad-damage");
                    level.getAnimals().forEach(function(animal){
                         var hpToLose = Math.round(animal.getMaxHP() * WEATHER_STORM_PERCENT_DAMAGE);
                         animal.loseHP(hpToLose, null, true); //passive; don't log that everyone was hurt  
                    }); 
               },
          }   
     ),
     
     Overcast: new Weather(
          "Cloudy", //name
          "cloud", //imageName,
          "Clouds filled the sky!", //begin
          "The clouds cleared.", //end
          {
               //functions
               _onRoundEnd: function(self){
                    //remove stat changes
                    level.getAnimals().forEach(function(animal){
                         animal.clearStatChanges();
                         //TODO clear afflictions? 
                    }); 
               },
          }           
     ),
     
     Night: new Weather(
          "Night", //name
          "night", //imageName,
          "Night suddenly fell!", //begin
          "The sun rose again.", //end
          {
               
               //functions
               _onBegin: function(self){
                    level.effectChanceMult = WEATHER_NIGHT_EFFECT_MULT;
               },
               
               _onFinish: function(self){
                    delete level.effectChanceMult;
               },
          } 
     )
};
