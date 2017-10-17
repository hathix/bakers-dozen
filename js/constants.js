//interface (clicking, bootstrap, jquery, etc)
//timing
/**
 * ms for a long click to be registered
 */
var LONG_CLICK_DURATION = 500;

/**
 * It takes this long (in ms) between enemy moves.
 * Without this enemies would appear to be all moving at once. 
 */
var ENEMY_TURN_DELAY = 1000;

//level
var MAX_ACTIVE_ALLIES = 5; //max allies who can be in a level and used
var TEAM_SIZE = MAX_ACTIVE_ALLIES;

var TEAM_NAMES = {
     ALLIES: "allies",
     ENEMIES: "enemies"
};

//multiplayer
var MIN_TEAMS = 2; //min human teams playing
var MAX_TEAMS = 4; //max human teams playing
var ELO_BASE_RANK = 1400;


/**
 * Constants for levels' stage numbers. Use this when directing to a new level.
 * FIRST: first level loaded when the level group is begun (dungeon entrance, for example.)
 * EXIT: link to this to finish the level group. The last level in a level group will link to EXIT.
 */
var LevelTypes = {
    FIRST: 0,
    EXIT: -1
};

var LevelGroupEnums = {
    numbers: {
        FIRST: 0        
    },
    types: {
        BATTLE: "battle",
        TOWN: "town",
        BOSS: "boss"    
    },
    statuses: {
        LOCKED:     { description: "Locked",    style: "text-error" },
        OPEN:       { description: "Open",      style: "text-success" },
        COMPLETED:  { description: "Completed", style: "text-success" },
        TOWN:       { description: "Town",      style: "text-info" },      
    }
};

//tiles
var BG_TYPES = "a,B,be,bn,c,d,D,e,F,f,g,h,i,l,m,p,R,r,S,Sl,Ss,sv,s,sw,t,w,wg,ws,W".split(",");
var IMPASSABLE_BGS = "a,e,l,w".split(",");

/**
 * A lookup table for background shorthand -> full name conversion. 
 * backgroundConverter[shorthand] = full
 */
var backgroundConverter = {
    "a":  "alpine",
    "B":  "brick",
    "be": "bridge-ew",
    "bn": "bridge-ns",
    "c":  "concrete",
    "d":  "dirt",
    "D":  "dirt-tile",
    "e":  "empty",
    "F":  "fairway",
    "f":  "forest",
    "g":  "grass",
    "h":  "haunted",
    "i":  "ice",
    "l":  "lava",
    "m":  "mud",
    "p":  "path",
    "R":  "red-carpet",
    "r":  "road",
    "S":  "sand",
    "Sl": "sand-light",
    "Ss": "sand-soft",
    "sv": "savannah",
    "s":  "snow",
    "sw": "swamp",
    "t":  "tile",
    "w":  "water",
    "wg": "water-green",
    "ws": "water-shallow",
    "W":  "wood"
};

//reference
var TILE_FLAGS = "bridgeable".split(","); //all possible flags

//stats
var AVERAGE_BASE_STAT = 50; //used as benchmark; base stats are usually 20-80
var MAX_BASE_STAT = 80;
var MIN_BASE_STAT = 20;
var AVERAGE_SPEED = 5;
var MIN_SPEED = 3;
var MAX_SPEED = 7;

//individual values
var IV_VARIATION = 0.05; //1 +- this
var IV_MIN = 1 - IV_VARIATION; //worst multilplier
var IV_MAX = 1 + IV_VARIATION; //best multiplier

 //effort values (skill points)
var EV_MAX = 25; //max evs you can have in one category
var EV_MIDDLE = 12; //half of MAX

//turns
var FOREVER = 2013; //an affliction can last FOREVER for instance

//afflictions
var AFFLICTIONS = {
     SLEEP: 'Asleep',
     CONFUSE: 'Confused',
     LOCKDOWN: 'In Lockdown',   
     STUN: 'Stunned',
     RECHARGE: 'Recharging'
};

//weather
var WEATHER_END_CHANCE = 0.15; //chance of weather ending on any given turn; weather lasts, on average, log(0.5)/log(1-THIS) turns.

var WEATHER_SUN_ATTACK_MULT = 1.1;
var WEATHER_RAIN_ATTACK_MULT = 0.9;
var WEATHER_SNOW_SPEED_DECREASE = 1;
var WEATHER_STORM_PERCENT_DAMAGE = 1/16; //how much of a person's hp should be lost every round
var WEATHER_NIGHT_EFFECT_MULT = 2; //all chances for side effect are mult'ed by this much

var WEATHER_TYPES = {
     NORMAL: "Normal",
     SUN: "Sun",
     RAIN: "Rain",
     SNOW: "Snow",
     STORM: "Storm",
     OVERCAST: "Overcast",
     NIGHT: "Night"
}

var statTypes = {
    ATTACK:     { name: "attack",   description: "Attack",  image: "sword" },
    DEFENSE:    { name: "defense",  description: "Defense", image: "shield" },
    HP:         { name: "hp",       description: "HP",      image: "heart" },
    SPEED:      { name: "speed",    description: "Speed",   image: "move" },
    ABILITY:    { name: "ability",  description: "Ability", image: "star" },    
};

//experience
var EXPERIENCE_PER_LEVEL = 1000;
var BASE_ATTACK_EXPERIENCE = 30; //gain this much for hitting a foe, not killing - at same level
var MAX_ATTACK_EXPERIENCE = 300; //max you can gain for hitting a foe
var BASE_KILL_EXPERIENCE = 250; //gain this much for killing a foe - at same level
var MAX_KILL_EXPERIENCE = 5000; //max you can gain for killing a foe

//hp
var OK_HP_BOUNDARY = 50; //hp% above this is green, below is yellow
var CRIT_HP_BOUNDARY = 25; //hp% above this is yellow, below is red

//items
var DEFAULT_DROP_CHANCE = 0.1; //chance of dropping an item

//battle
var MULTIPLIER_VARIATION = 0.3; //1 +- this
var MIN_MULTIPLIER = 1 - MULTIPLIER_VARIATION;
var MAX_MULTIPLIER = 1 + MULTIPLIER_VARIATION
var CHANCE_OF_CRITICAL = 0.1; //default chance of landing a critical hit
var CRITICAL_DAMAGE_MULTIPLIER = 2; //crits do this times as many damage

//animal levels
var MIN_LEVEL = 1;
var MAX_LEVEL = 50;
/**
 * Enemies will be this many levels away from their average.
 * In reality, ~68% of enemies will be within this/3, and ~95% will be within this*2/3. 
 */
var MAX_ENEMY_LEVEL_DEVIATION = 6; //enemies can be this many levels away from their average

//dialogues
var DIALOGUE_TYPES = {
    ally:   { cssClass: "success", pictureFolder: "animals" },
    enemy:  { cssClass: "bad-damage", pictureFolder: "animals" },
    neutral:{ cssClass: "alert",   pictureFolder: "animals" },
    sign:   { cssClass: "alert",   pictureFolder: "grid-objects" }        
};

//actions
var TARGET_TYPES = {
    friend: "friend",
    foe:    "foe" 
};

//difficulty
var DIFFICULTIES = {
     // levelBias: enemies will be levelBias levels away from ally average, on average
     EASY:     { name: "Easy",     levelBias: -1 },
     STANDARD: { name: "Standard", levelBias: 0  },
     HARD:     { name: "Hard",     levelBias: 1  }     
};

//display
var TILE_SIZE = 40; //length and width (px) of a tile

//save load
var SL_KEYS = {
     teams:    "bd-teams"
}
