/**
 * A series of key-value pairs for easy data storage. 
 * Use this to store info about a level, actor, etc.
 * 
 * API:
 * Flags([Object[] pairs]) //pass pairs if you have them, otherwise no params
 * void setFlag(String key, [Object value]) //value can be anything; it's true if you don't pass it
 * Object getFlag(String key, [Object default]) //if there's no value at key, default will be used (or 0)
 * 
 * To simply store a list of Strings (a list of simple data bits), use something like this:
 * setFlag("key")
 * String result = getFlag("key")
 * if(getFlag("key") == something){ ... }
 */
var Flags = new Class({
 
/**
 * Creates a set of key-value pairs. If you have an old set of pairs stored somewhere (just key-value pairs, not the actual Flags object), pass that.
 * @param {Object[]} pairs  [optional] a series of key-value pairs (the old pairs), if you have it. The Flags will be initialized with these values.
 */
__init__: function(self, pairs){
    self.pairs = orDefault(pairs, {});
},

/**
 * Gets the value at the given key, or the default value if it doesn't exist.
 * After calling this, the flag with the given key will be defined, guaranteed.
 * @param {String} key  a key to use to look up the value
 * @param {Object} def  [optional] the value to use if the given key isn't found or doesn't exist yet. If you don't provide this, 0 will be used as the default.
 * @return {Object} whatever was stored at the given key, or the default value.
 */
getFlag: function(self, key, def){
    def = orDefault(def, 0);
    if(self.pairs[key] == undefined){
        self.pairs[key] = def;
    } 
    
    return self.pairs[key];
},

/**
 * Sets the flag at the given key to the given value. This can be accessed later with getFlag(key).
 * @param {String} key  a unique string to identify the value
 * @param {Object} value    [optional] any object, number, etc. to store there. Defaults to true.
 */
setFlag: function(self, key, value){
    value = orDefault(value, true);
    self.pairs[key] = value;
},

/**
 * Returns true if the flag at the given key exists.
 * @param {String} key  a key to use to look up the value.
 */
hasFlag: function(self, key){
    if(self.pairs[key] == undefined) return false;
    return true;
}
});
