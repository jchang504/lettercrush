# Lettercrush

Lettercrush is a web-based AI assistant for the game
[Letterpress](http://itunes.apple.com/us/app/letterpress-word-game/id526619424)
. A mostly-finished version is hosted
[here](http://www.contrib.andrew.cmu.edu/~jemminc/lettercrush/). You can use it
to destroy your friends in Letterpress or hone your own skills by playing as
the "opponent" and always choosing the first choice move for the AI. It saves
your games automatically after each move in [HTML5 local
storage](http://www.w3schools.com/html/html5_webstorage.asp).

## About

Lettercrush was designed and written by Jemmin Chang (jchang504) during summer
2014 while learning JavaScript and other web technologies. It is based on, but
largely improved from, an earlier version written in Java for a high school
senior project. More info is available on
[http://jemm.in](http://www.contrib.andrew.cmu.edu/~jemminc/).

Lettercrush is not being actively maintained or developed. There are a few
known small logical and UI bugs that may someday be fixed, but it is suitable
for everyday Letterpress assistant (some prefer the term "cheating") purposes.

## AI

Lettercrush employs a few well-known AI techniques plus some of my own tweaks
to achieve truly crushing performance against competitor apps within very
reasonable time bounds (a few seconds per move is adequate). I don't have stats
for Lettercrush specifically (the only way to get data is to manually play
games using two apps against each other; when two AIs are playing, the games
get long...), but its less-tuned precursor, Letterpress Victory, had a 5/5
going-first and 7/8 going-second winrate against a leading app called
Letterbrain in random games when I ran some trials in 2013.

### Minimax and Alpha-Beta Pruning

The basic algorithm is minimax with alpha-beta pruning. The leaf node
evaluation heuristic is simple - 2 points for a locked blue square, 1 point for
unlocked blue, 0 for neutral, -1 for unlocked red, and -2 for locked red. I
have yet to explore tweaking these parameters; they seem to work pretty well.

### Ternary Search Trie

Lettercrush stores the Letterpress dictionary in a ternary search trie, which
uses much less memory than a standard trie, and allows us to search for words
by exploring possible paths in the tree checked against our available tiles,
rather than vice-versa: this turned out to yield an incredible performance
boost. Two birds with one data structure.

### Iterative Deepening and Narrowing

I help the alpha-beta prune more branches with iterative deepening: Lettercrush
does a heuristic evaluation of the full list of possible moves first,
reordering them by their values, then uses this ordering of the moves to do a
2-ply evaluation to produce a new ordering, and so on to the desired depth. I
also added to this what I call "iterative narrowing" - trimming the list of
candidate moves down each iteration. The idea is that, for Letterpress, any
moves that have bad value at a shallower level are extremely unlikely to be
good if we evaluate them deeper. In other words, the chance that the best move
doesn't do much in the short run but has some important consequence further
down the game tree is negligible. This is a guess totally based on intuition,
and I'm still not entirely convinced that it's correct.

The useful consequence of iterative narrowing, of course, is speed.
Specifically, we trim the list to exactly the fractional power of its full size
to guarantee that, even if our alpha-beta doesn't work at all and we explore
the full n^d nodes (where n is the chosen list length) for a depth d
evaluation, we take at most the same amount of time as our heuristic evaluation
of all moves. In practice, with alpha-beta, this means that each successive
iteration typically takes less time than the last. 

### Speed/Timeout

Still, exploring a game tree with a branching factor with 4 or 5 zeroes takes a
long time. The Lettercrush web app allows the user to choose either a depth
(ply) limit or a time limit, as well as the number of top moves they want as
output. The time limit takes some tricks to implement (thanks to JS's
single-threadedness); basically, we check the time every some number of moves
to make sure we don't go too much over the time limit. At the top of each
iteration of the IDDFS, we also check to make sure we have enough time to at
least process enough moves to produce a best moves list of the requested
length, and if not, we stop and don't evaluate at the next depth.

Since this project was my first in JavaScript, I also spent a lot of time
exploring and benchmarking different methods in JavaScript to make Lettercrush
as fast as I could.  I found out that using prototype methods, slicing to
copy arrays, etc. make a big difference.
