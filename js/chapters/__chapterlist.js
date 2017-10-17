/**
 * An object you can use to get a chapter.
 * Call chapterList.get(int) to get the chapter with the given number.
 * To add a chapter to the list, call chapterList.add(int, function)
 */
var chapterList = new Singleton({
    
__init__: function(self){
    self.chapterFunctions = [];    
},

/**
 * Returns the chapter with the given number. This is done dynamically to save memory.
 * @param {int} chapterNumber   the ordinal number of the chapter.
 * @return {Chapter}
 */
get: function(self, chapterNumber){
    var func = self.chapterFunctions[chapterNumber];
    return func();
},

/**
 * Used when coding a chapter. Registers the given chapter-creating function with a certain number.
 * The chapter can then be gotten with chapterList.get();
 * @param {int} chapterNumber   the ordinal number the chapter should have.
 * @param {function} chapterFunction    a function that returns the chapter. Should take no args and return a Chapter object. It will be called (and its return value used) when necessary.
 */
add: function(self, chapterNumber, chapterFunction){
    self.chapterFunctions[chapterNumber] = chapterFunction;
}

});
