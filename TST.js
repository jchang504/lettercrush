// This file implements a Ternary Search Trie

/* Constructor for a TST
 * REQUIRES: dictionary is an array of lowercase words in alphabetical
 * order (very important for building a balanced tree!)
 */
function TST(dictionary) {
  var root = new TSTNode();
  var blocked = [];

  this.getRoot = function() {
    return root;
  }

  // unblocks (inserts) all blocked words
  this.unblock = function() {
    for (var i = 0; i < blocked.length; i++) {
      this.insert(blocked[i]);
    }
  }

  // Adds an array of words to the TST
  this.addWords = function(words) {
    if (words.length <= 2) {
      for (var i = 0; i < words.length; i++) {
        if (words[i].length !== 0) {
          this.insert(words[i]);
        }
      }
    }
    else { // length >= 3
      var medianIndex = Math.floor(words.length / 2);
      this.insert(words[medianIndex]);
      this.addWords(words.slice(0, medianIndex)); // add left
      this.addWords(words.slice(medianIndex + 1, words.length)); // add right
    }
  }

  /* Insert
   * REQUIRES: word is a lowercase string
   * ENSURES: inserts the word into the TST
   */
  this.insert = function(word) {
    var temp = root;
    var i = 0;
    while (i < word.length) {
      var wordLetter = word.substring(i,i+1);
      if (wordLetter === temp.letter || temp.letter === null) {
        temp.letter = wordLetter;
        if (i == word.length - 1) {
          temp.endsWord = true;
        }
        else { // if not done, go on to next
          if (temp.next == null) {
            temp.next = new TSTNode();
          }
          temp = temp.next;
        }
        i++; // go to next letter
      }
      else if (wordLetter < temp.letter) {
        if (temp.left == null) { // create node if needed
          temp.left = new TSTNode();
        }
        temp = temp.left; // move left
      }
      else { // wordLetter > temp.letter
        if (temp.right == null) { // create node if needed
          temp.right = new TSTNode();
        }
        temp = temp.right; // move right
      }
    }
    // end insert
  }

  /* Lookup
   * REQUIRES: word is a string
   * ENSURES: returns true iff word is contained in the TST; false otherwise
   */
  this.lookup = function(word) {
    word = word.toLowerCase();
    var temp = root;
    for (var i = 0; i < word.length; i++) {
      temp = temp.findSibling(word.substring(i,i+1));
      if (temp == null) { // letter not found
        return false;
      }
      else { // temp.letter == word.substring(i,i+1); go to next
        temp = temp.next;
        if (temp == null) {
          return false;
        }
      }
    }
    // now temp is the node of the last letter, so
    return temp.endsWord;
  }

  // define stuff first, then finish constructing
  this.addWords(dictionary);

}

/* Constructor for TSTNode class
 * Creates a new blank Node (should only be called in TST methods, and
 * immediately filled with values)
 */
function TSTNode() {
  // private variables
  this.letter = null;
  this.endsWord = false;
  this.left = null;
  this.right = null;
  this.next = null;

  // temp for debugging
  this.countNodes = function() {
    var count = 0;
    if (this.left != null) {
      count += this.left.countNodes();
    }
    if (this.right != null) {
      count += this.right.countNodes();
    }
    if (this.next != null) {
      count += this.next.countNodes();
    }
    return count+1;
  }
  //temp

  // privileged methods

  /* Goes left or right to find the sibling matching the sibLetter, and
   * returns it. If it can't be found, returns null. May return itself.
   */
  this.findSibling = function(sibLetter) {
    if (sibLetter < this.letter) {
      if (this.left != null) {
        return this.left.findSibling(sibLetter);
      }
      else { // nothing on the left
        return null;
      }
    }
    else if (sibLetter > this.letter) {
      if (this.right != null) {
        return this.right.findSibling(sibLetter);
      }
      else { // nothing on the right
        return null;
      }
    }
    else { // sibLetter == letter
      return this;
    }
  }



  /* Deletes this word from the TST, and adds it to the blocked list
   * REQUIRES: word is a string, minimum length 2, which is in the TST
   * ENSURES: if word is not found in TST, returns false; else returns true
   */
  this.block = function(word) {
    if (blocked === undefined) {
      blocked = [];
    }
    var start = this.findSibling(word.substring(0,1));
    if (start == null) {
      return false;
    }
    if (start.deleteWord(word.substring(1))) {
      blocked.push(word);
      return true;
    }
    else {
      return false;
    }
  }

  /* Deletes this word from the TST, AFTER the current node (see block)
   * REQUIRES: word is a string with length >= 1
   */
  this.deleteWord = function(word) {
    if (next == null) {
      return false;
    }
    var wordLetter = word.substring(0,1);
    if (word.length == 1) {
      var relation = 0; // parentNode.getNext() == childNode
      var parentNode = this;
      var childNode = next;
      var childLetter = childNode.getLetter();
      while (wordLetter != childLetter) {
        parentNode = childNode;
        if (wordLetter < childLetter) {
          childNode = childNode.getLeft();
          if (childNode == null) {
            return false;
          }
          relation = -1; // parentNode.getLeft() == childNode
        }
        else {
          childNode = childNode.getRight();
          if (childNode == null) {
            return false;
          }
          relation = 1; // parentNode.getRight() == childNode
        }
        childLetter = childNode.getLetter();
      } // now childLetter == wordLetter
      // if childNode is total leaf
      if (childNode.getLeft() == null && childNode.getRight() == null && childNode.getNext() == null) {
        switch(relation) { // remove it from tree
          case -1:
            parentNode.setLeft(null);
            break;
          case 0:
            parentNode.setNext(null);
            break;
          case 1:
            parentNode.setRight(null);
            break;
        }
      }
      else { // childNode is not a leaf
        childNode.setEndsWord(false);
      }
    }
    else {
      var nextNode = next.findSibling(wordLetter);
      if (nextNode == null) {
        return false;
      }
      return nextNode.deleteWord(word.substring(1));
    }
    // delete successful
    return true;
  }

}
