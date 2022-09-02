const renderer = new Renderer(document.getElementById('mainDiv'));

const gameState = new GameState(28, 28);
gameState.generateWalls();


document.onkeypress = function (evt) {
  gameState.nextReceptors();
};

let prevTime = null;
const iteration = function () {
  const time = new Date().getTime();
  const renderFeedback = renderer.render(gameState);

  if (prevTime != null) {
    // TODO(jimblackler): contemplate how to avoid requiring feedback.
    gameState.process(time - prevTime, renderFeedback);
  }
  prevTime = time;
  setTimeout(iteration, 1);

};

iteration();
