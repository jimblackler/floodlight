var renderer = new Renderer(document.getElementById("mainDiv"));

var gameState = new GameState(28, 28);
gameState.generateWalls();


document.onkeypress = function (evt) {
  gameState.nextReceptors();
};

var prevTime = null;
var iteration = function () {
  var time = new Date().getTime();
  var renderFeedback = renderer.render(gameState);

  if (prevTime != null) {
    // TODO(jimblackler): contemplate how to avoid requiring feedback.
    gameState.process(time - prevTime, renderFeedback);
  }
  prevTime = time;
  setTimeout(iteration, 1);

}

iteration();
