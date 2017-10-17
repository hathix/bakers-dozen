/**
 * A collection of jQuery and other utilities. 
 */

/* SSBD specific */

/**
 * Makes a quick notification to tell the user something.
 * @param {String} text  what to say.
 * @param {String} type  one of the following. Default is 'alert'.
 *   alert - white and striped. Use it for pretty much everything.
 *   success - green. Use it for good things.
 *   error - red. Use it for very bad things.
 *   warning - yellow and striped. Use it for slightly bad things or alt-styled things.
 *   info - blue. Use it for special actions and really extraordinary things.
 * 
 *   good-damage    light green. Use it for when you damage foes.
 *   bad-damage     light red. Use it for when foes damage you.   
 * TODO edit the libs/notification/themes/default.js (go to bottom with case statements) to add new types.
 */
function log(text, type){
     if(!text) return;
     noty({
          text: text,
          type: type,
          dismissQueue: true,
          layout: 'topRight',
          timeout: 4000 //ms until it's hidden
     });   
}

/**
 * Prints the time (in milliseconds) since you last called this function.
 * @param {String} label [optional] if passed, this will be shown along with the time. PASS FALSE TO PREVENT LOGGING ALTOGETHER.
 */
function time(label){
     var newTime = new Date();
     var diff = newTime - lastTime;
     if(label) console.log(label + ": " + diff);
     else if(label !== false) console.log(diff);
     else {}
     lastTime = newTime;
}
var lastTime = new Date();

/**
 * Gives more info about the team given its name.
 * @param {String} teamName   the team's name; from TEAM_TYPES.[type].name
 * @return {Object} an object from the TEAM_TYPES array; you can see name, class, etc here
 */
function getTeamInfo(teamName){
     var teamInfo = null;
     Object.values(TEAM_TYPES, function(value){
          if(value.name == teamName)
               teamInfo = value;
     });
     return teamInfo;
}

/**
 * Waits for all pending animations (of actors) to finish, then calls the callback.
 * @param {function()} callback    will be called, with no args, when animations finish. 
 * @param {jQuery} watch      [optional] if passed, we will watch this set of jquery elements for animation; by default we look at all actors 
 */
function waitForAnimations(callback, watch){
     watch = orDefault(watch, $('.actor'));
     var wait = setInterval(function() {
          if( !watch.is(":animated") ) {
               clearInterval(wait);
               callback();
          }
     }, 101);  //fire every this many ms; make this 1 off from every 100 since we fire animations about every 100    
}

/**
 * Changes the appearance of a progress bar to match the given HP, changing colors if necessary.
 * @param {jQuery} progress   A <div class="progress"> element (i.e. a progressbar.)
 * @param {Animal} animal     the animal whose info should be shown.
 * @param {boolean} showText  [optional; default false] Shows text on HP bar (e.g. 10/10).
 */
function updateHPBar(progress, animal, showText){
    //update HP bar width & text
    var hpp = animal.getHPPercent();
    progress.find('.hp-bar').css('width', hpp + '%');
    if(showText)
     progress.find('.hp-bar').html(sprintf("%d/%d", animal.currentHP, animal.getMaxHP())); //TODO make this relative to entire bar not just filled part
    //add green/yellow/red coloring
    progress.find('.hp-bar').removeClass('bar-success bar-warning bar-danger');
    var cssClass;
    if(hpp <= CRIT_HP_BOUNDARY) cssClass = 'bar-danger'; //red
    else if(hpp >= OK_HP_BOUNDARY) cssClass = 'bar-success'; //green
    else cssClass = 'bar-warning'; //yellow
    progress.find('.hp-bar').addClass(cssClass);     
}

/* general */


/**
 * Center the browser view on the given element.
 * @param {jQuery} element    the element to center on the screen. Can be any size.
 * @param {jQuery} parent     [optional] the element that the first element will be centered with respect to. Defaults to $(window).
 * @param {boolean} vertical    [optional] pass false to not center it vertically (y).
 * @param {boolean} horizontal  [optional] pass false to not center it horizontally (x);
 */
function scrollToCenter(element, parent, vertical, horizontal) {
    if(!parent) parent = $(window);
    var offsetX = (parent.width() - element.width()) / 2;
    var offsetY = (parent.height() - element.height()) / 2;
    
    if(horizontal !== false)
        element.css('left', offsetX);
    if(vertical !== false)
        element.css('top', offsetY);
    
    return offsetY + " " + offsetX;
}

/**
 * Wraps the given object in a Cobra-like manner, so that it can easily be appended to a Cobra class. 
 * You can have fields and functions.
 * The original object will not be modified.
 * @param {Object} self the object that self will be when obj is called. This should be the Cobra class object that this will merge into.
 * @param {Object} obj  contains some fields and functions.
 * @return {Object} a clone of object, except rewritten in such a way that it can be harmoniously combined with an existing Cobra object.
 */
function cobraWrap(self, obj){
    obj = Object.clone(obj);
    var key, member;
    for (key in obj) {
        member = obj[key];
        // Don't wrap things on object.prototype with self
        if (Object.prototype[key] == member) {
            continue;
        }
        if (typeof member == 'function') {
            obj[key] = Cobra.Class.method(member, self);
        }
    }
    
    return obj;
}

/**
 * Returnsthe given value if it's defined, or default if it isn't. For example, call this:
 * orDefault(x, 0)
 * To get x, or 0 if it isn't defined.
 */
function orDefault(supposed, def){
    if(typeof supposed == undefined || supposed == undefined) return def;
    return supposed;
}

function orIfFalsy(supposed, def){
    if(truthiness(supposed))
        return supposed;
    else
        return def;
}

/**
 * Enhanced version of the standard truthiness function.
 * If the value is any of the following, this returns false:
 *  false, 0, undefined, null, NaN, "" - standard
 *  [], {} - custom
 * 
 * @param {Object} val  any value
 * @return {Boolean} true if truthy, false if falsy - if it's falsy, it's probably not well-defined so do some default. 
 */
function truthiness(val){
    if(!val) return false;
    if(val instanceof Array && val.isEmpty()) return false;
    if(Object.equal(val, {})) return false;
  
    return true;
}


/**
 * Runs a trial. Use to simulate random events and get a result.
 * @param {float} chance    the chance something will happen. 0.5 means 50%. Higher chance means the result is more likely to be true.
 * @return {boolean} true if it will happen under the randomness, false otherwise 
 */
function pushLuck(chance){
    return Math.random() < chance;
}

/**
 * Works much the same as .click(), except it unbinds any existing click events beforehand.
 * Use this if you want to quickly overwrite the click handler.
 * This also works with touch interactions
 */
$.fn.oneClick = function(callback){
    this.oneBind("click", callback);
}

/**
 * Works just like bind(), except it unbinds any existing bind events so that only one is active at once.
 * @param {string} event    the type of event
 * @param {function} callback   will be called when the event is triggered 
 */
$.fn.oneBind = function(event, callback){
    this.off(event);
    this.on(event, callback);
}

/**
 * Returns the actual HTML representation of this jQuery element. 
 */
$.fn.outerHTML = function(){
    return this.clone().wrap('<p>').parent().html();
}

/**
 * Binds to a LONG click. This unbinds any previous long click binds (so it's like oneLongClick). 
 */
$.fn.longClick = function (callback, timeout) {
   // bind to element's mousedown event to track the longclick's beginning
   $(this).oneBind("mousedown.long touchstart.long", function (event) {
    // save the initial event object
    var initialEvent = event;
    // set the delay after which the callback will be called
    var timer = window.setTimeout(function () { callback(initialEvent); }, timeout);
    // bind to global mouseup event for clearance
    $(document).bind("mouseup.long touchend.long touchcancel.long", function () {
      // clear timer
      window.clearTimeout(timer);
      // unbind from global mouseup event
      $(document).unbind("mouseup.long touchend.long touchcancel.long");
      return false;
      // use 'return false;' if you need to prevent default handler and
      // stop event bubbling
    });
     return false;
     // use 'return false;' if you need to prevent default handler and
     // stop event bubbling
   });
  }

/**
 * Clones an HTML template with the given ID and returns it.
 * The template should have the class "hidden".
 * @param {String}  id  the id of the template you want to clone in the HTML (don't include the hashtag #).
 * @return {jQuery}     a copy of that template.
 */
function getClonedTemplate(id){
    var clone = $('#' + id).clone().removeAttr('id').removeClass('hidden');
    return clone;
}

/*
 * Usage:
 * sprintf('You bought %s widgets', numWidgets);
 * sprintf('That makes %d dollars and %d cents', costDollars, costCents);
 * 
 * %d - displayed as int
 * %s - displayed as string
 * 
 * More powerful sprintf (but also bigger): http://www.diveintojavascript.com/projects/javascript-sprintf
 */
function sprintf(s) {
    var bits = s.split('%');
    var out = bits[0];
    var re = /^([ds])(.*)$/;
    for (var i=1; i<bits.length; i++) {
        p = re.exec(bits[i]);
        if (!p || arguments[i]==null) continue;
        if (p[1] == 'd') {
            out += parseInt(arguments[i], 10);
        } else if (p[1] == 's') {
            out += arguments[i];
        }
        out += p[2];
    }
    return out;
}

/**
 * Applies random variation to a certain value (which is rounded to an int.) 10 might become 8 or 11, for example.
 * @param   {int}   original    the original value
 * @param   {number}    exaggeration    [optional] if you supply this, the multipliers will be powered by exaggeration, so the results are more extreme: a low multiplier is really low, a high one is really high. Default 1.
 * @param   {number}    minMultiplier   [optional] pass a custom value here if you like. original will be multiplied by this at worst.
 * @param   {number}    maxMultiplier   [optional] pass a custom value here if you like. original will be multiplied by this at best.
 * @return  {int}   the original number with random variation added, then rounded to the nearest int.
 */
function randomVariation(original, exaggeration, minMultiplier, maxMultiplier){
    //set default
    var min = minMultiplier != undefined ? minMultiplier : MIN_MULTIPLIER;
    var max = maxMultiplier != undefined ? maxMultiplier : MAX_MULTIPLIER;
    
    var randomMultiplier = Math.random() * (max - min) + min;
    if(exaggeration != undefined)
        randomMultiplier = Math.pow(randomMultiplier, exaggeration);
    
    var applied = Math.round(original * randomMultiplier);
    if(applied <= 1)
        applied = 1;
    return applied;
}



/**
 * Confines the given value such that floor <= value <= ceil. Ensures it's in a given range.
 * @param {int} value    the raw value.
 * @param {int} floor    the minimum value you want returned.
 * @param {int} ceil     the max value you want returned.
 * @return {int}    either value, floor, or ceil.
 */
function confine(value, floor, ceil){
     if(value < floor) return floor;
     if(value > ceil) return ceil;
     return value;
}

/**
 * Returns the probability (in range [0,1]) that a normally-distributed sequence around mean will contain x.
 * @param {int} x        the number whose probability you want to test.
 * @param {int} mean     the mean/median/mode (all the same thing); the central/most common value in your distribution
 * @param {float} stdev  [optional] <1 for clustered data, >1 for spread-out data, 1 for normal distro.
 */
function normal(x, mean, stdev){ 
     stdev = orDefault(stdev, 1);
     return 1/(stdev*Math.sqrt(2*Math.PI))*Math.pow(Math.E,(-Math.pow(x-mean,2))/(2*Math.pow(stdev,2))) 
}

/**
 * Given a range of numbers, chooses a random one using normal distribution (i.e. anything closer to the mean is more likely to occur than something far away); for this reason it's better than straight-up RNG'ing.
 * This works best with quantized value (including but not limited to integers.)
 * @param {Number} mean     the central/most common value; the average value of all the numbers you generate
 * @param {Number} maxDeviation  all numbers you generate will be from [mean-maxDev, mean+maxDev].
 * @param {Number} step       for quantized values, the min diff between any two numbers (for integers step=1).
 * @param {int} howMany       [optional; default 1] how many random numbers you want. They'll all use the same param. Use this if generating several of the same kind of values to avoid lots of computation.
 * @return {Number or Number[]}    an array of [howMany] nums in range [mean-maxDev, mean+maxDev]; it's more common to get one near the mean. If you specify howMany=1 you get a Number (not in array), else you get an array.
 */
function normalVariation(mean, maxDeviation, step, howMany){
     howMany = orDefault(howMany, 1);
     var maxStdevs = 3; //we scale it such that 3 stdev's away (-3) = mean-maxDev and v.v.
     //ignore mean for now
     //scale it so that +maxDev = 3, -maxDev = -3
     //what we do: take a bunch of samples at various quantized ranges
     //we want sampleStep * maxDeviation = maxStdevs (.5 * 6 = 3), so rearrange; if we have X steps, we have to sample X as many times to account for them
     var sampleStep = maxStdevs / maxDeviation * step; //so we sample at -3 ... 0-2s, 0-s, 0, 0+s, 0+2s ... 3
     var samples = [];
     //fill up array with list of all nums to sample
     for(var val = -maxStdevs; val < maxStdevs; val += sampleStep){ 
          samples.add(val); 
     }
     
     var accuracy = 1000; //how big to make our weighted array full of samples
     //now we find the probability of each sample from the function
     //and add the sample value (prob * accuracy) times
     //so that we add about 40 0's if accuracy = 100 (prob of 0 ~= .4)
     var basket = []; //fill this with [accuracy] numbers
     samples.forEach(function(sample){
          var probability = normal(sample, 0); //pretend mean is 0 for now, we'll weight it later
          var addTimes = Math.round(probability * accuracy);
          for(var i=0; i<addTimes; i++){ 
               basket.add(sample); 
          }     
     });
     //now if we choose a random number from the basket, that is the number of stdev's away our chosen number will be
     var stdevsAway = basket.sample(howMany); //array
     //convert back into sample'd values; sampleStep * maxDeviation = maxStdevs
     //so if maxDev = 6, a range of [-3,0] -> [-1,0] -> [-6,0]
     var actualVariations = stdevsAway.map(function(x){
          return x / maxStdevs * maxDeviation;
     });
     //add to mean to get real vals
     var actualValues = actualVariations.map(function(x){
          return x + mean;
     });
     
     if(howMany == 1)
          return actualValues[0];
     return actualValues;
}

/**
 * Returns the new Elo rankings (for ranking players based on wins or losses) after a multiplayer battle.
 * Usage: say a person ranking 1200 beat someone with ranking 1400. Call getNewEloRankings([1200,1400],[1,2]) -> [1211,1389]
 * @param {int[]} initRankings     the initial ranking (score) of your various teams (as many as you want.) Pass in any order.
 * @param {int[]} places           the order the team finished: the team who won got 1st, runner-up got 2nd, etc. Pass in the SAME ORDER as initRankings; i.e. places[x] should give the place of the team with initRankings[x]. If two people tied, pass the same value for both; e.g. if two people tied for 1st, pass [1,1,3,4]
 * @return {int[]}  new rankings for the players, in the same order as they were passed in in initRankings.
 * 
 * @see http://elo.divergentinformatics.com/
 */
	

/**
 * Returns a random IV, or individual value for stats, which the stat is multiplied by.
 * @return  {float} a float from about 0.9 to 1.1 (subject to change)
 */
function calculateIV(){
    //TODO: make normal distribution somehow
    return Math.random() * (IV_MAX - IV_MIN) + IV_MIN;
}

function showProps(obj, obj_name) {
  var result = "";
  obj_name = orDefault(obj_name, "obj");
  for (var i in obj)
    result += obj_name + "." + i + " = " + obj[i] + "\n";
  return result;
}


/**
 * Compresses an object into its bare-minimum fields. Decompress it with decompress().
 * @param {Object} obj  any object.
 * @param {String/Object[]} keysToSave  a list of keys of the object to save to a compressed object. If given a string, that field of the original object will be copied straight to the compressed - works best with ints and strings. If given an Object { name: function(obj, value)}, the function will be called with the compressed object and the value at the appropriate field in the original object. You can assign directly to obj; if so don't return anything. Return a value and it'll be saved to the [name] property of the compressed object.
 * 
 * Usage:
 * compress({a:5,b:3,c:2,d:{x:"asdf"}}, ['a','b', { d: function(compressed, val){ return val.x + " :)"; }}])
 *   => {a: 5, b: 3, d: "asdf :)"}
 */
function compress(obj, keysToSave){
    var compressed = {};
    
    keysToSave.forEach(function(key){
        //key is either string (prop from obj) or object (custom handler)
        if(Object.isString(key)){
            //get the property named key from the obj and put it into the compressed
            compressed[key] = obj[key];
        }    
        else if(Object.isObject(key)){
            //custom handler; contains { name: function } pair
            var name = Object.keys(key)[0];
            var func = Object.values(key)[0];
            
            var result = func(compressed, obj[name]);
            if(result !== undefined)
                compressed[name] = result;
        }
    });
    
    return compressed;
}

/**
 * Given a primitive object stored from compress(), reinflates it into a proper object. This is Cobra-compatible.
 * @param {Object} obj  a raw, primitive object gotten from compress; or just key-value pairs
 * @param {String} className    the name of the class, such as "String". This will be called with the args.
 * @param {String[]} keysInInit the keys of the values you want to be passed to the constructor. The values will be gotten from obj.
 * @param {String/Object[]} keysOutsideInit [optional] the values at these keys (from obj) will be tacked straight on to the proper object. Specify a string to get the value (usually int/string) from the obj. Specify { name: function(obj, value)} and it'll be called with the proper object and value at the given key. You can do custom init (such as calling a setter) or manipulation. Return a value and it'll be tacked directly onto the proper object.
 * 
 * Usage:
 * decompress({a: 3, b: 5, c: { name: "A" }}, "Object", ['a'], 
 * ['b', { 'c': function(obj, value){ return value.name + " :)"} }]);
 */
function decompress(obj, className, keysInInit, keysOutsideInit){
    //apply the constructor
    //args to constructor
    //keysInInit is a list of strings
    var args = keysInInit.map(function(key){
        var value = obj[key];
        if(value === undefined){
            //nothing saved there; omit it
            return null;
        }
        return JSON.stringify(value); //turns raw strings into strings with quotes around them 
    });
    //this may have some null values in it
    args = args.compact();
    
    //make a big string and eval it
    var str = sprintf("new %s(%s)", className, args.join(","));
    var goodObj = eval(str);
    
    //add on keys outside
    if(keysOutsideInit){
        keysOutsideInit.forEach(function(key){
            //if they specified a custom handler, it's an object; else just a string
            if(Object.isString(key)){
                goodObj[key] = obj[key];
            }   
            else if(Object.isObject(key)){
                //custom handler: it's { name: function } where function returns what to assign it to
                var name = Object.keys(key)[0];
                var func = Object.values(key)[0];
                
                var result = func(goodObj, obj[name]); //pass it the value stored in the primitive object
                //if they already did it, they returned nothing; else, they returned what to set the value to
                if(result !== undefined)
                    goodObj[name] = result;
            } 
        });
    }
    
    return goodObj;
}