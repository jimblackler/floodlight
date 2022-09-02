var GameState = function(width, height) {
  this.width = width;
  this.height = height;
  this.grid = [];
}

GameState.prototype.generateWalls = function(seed) {

  if (seed) {
    window.random = new Alea(seed);
  } else {
    window.random = new Alea();
  }
  var outer = this;
  if (false) { // Method one
    // seed
    for ( var idx = 0; idx != this.width * this.height; idx++) {
      this.grid[idx] = random() < .025;
    }

    // spread
    for ( var pass = 0; pass != 4; pass++) {
      for ( var idx = 0; idx != this.width * this.height; idx++) {

        this.forNeighbours(idx, function(neighbour) {
          if (outer.grid[neighbour] && random() < .15) {
            outer.grid[idx] = true;
          }
        });
      }
    }
  } else {

    for ( var walls = 0; walls != 35; walls++) {
      var x;
      var y;
      for ( var attempts = 0; attempts != 4; attempts++) {
        x = Math.floor(random() * this.width / 3) * 3;
        y = Math.floor(random() * this.height / 3) * 3;
        var node = outer.getNode(x, y);
        if (outer.grid[node]) {
          break;
        }
      }

      var dx;
      var dy;
      var r = random();
      if (r < 0.25) {
        dx = -1;
        dy = 0;
      } else if (r < 0.50) {
        dx = 1;
        dy = 0;
      } else if (r < 0.75) {
        dx = 0;
        dy = -1;
      } else {
        dx = 0;
        dy = 1;
      }
      var length = Math.floor(random() * 2 + 1) * 3;
      while (length--) {
        var node = outer.getNode(x, y);
        if (node == null) {
          break;
        }
        if (x == 0 && y == 0) {
          // HORRIBLE hack for outer walls interior problem. Fix properly.
          break;
        }
        outer.grid[node] = true;
        x += dx;
        y += dy;
      }

    }
  }

  this.bodies = new Bodies(this);

  this.generateReceptors();

  this.receptorsIdx = 0;
  this.nextReceptors();

};

GameState.DONE_DELAY = 2 * 1000;

GameState.prototype.generateReceptors = function() {

  // Use dead-reckoning to discover valid light positions.
  var ctx = document.createElement("canvas").getContext("2d");
  var totalRequired = 10;
  var throwAway = 5;
  var targets = totalRequired + throwAway;
  this.allReceptors = [];
  var minDistance = 7;
  while (this.allReceptors.length < targets) {
    var receptors = [];
    for ( var count = 0; count < 5; count++) {
      while (true) {
        var x = Math.floor(random() * this.width) + .5;
        var y = Math.floor(random() * this.height) + .5;
        if (!this.isBlockedXY(Math.floor(x), Math.floor(y))) {
          var valid = true;
          var light = (count != 0);
          for ( var idx = 0; idx != receptors.length; idx++) {
            var other = receptors[idx];
            if (light == other.light) {
              var distance = (x - other.x) * (x - other.x) + (y - other.y) * (y - other.y);
              if (distance < minDistance * minDistance) {
                valid = false;
                break;
              }
            }
          }
          if (valid) {
            receptors.push({
              x : x,
              y : y,
              light : light
            });
            break;
          }
        }
      }
    }

    var failed = 0;
    var succeeded = 0;
    var example;
    for ( var y = 0; y != this.height; y++) {
      for ( var x = 0; x != this.width; x++) {
        if (!this.isBlockedXY(x, y)) {
          var lightPosition = {
            x : x + .5,
            y : y + .5
          };
          RayCaster.loadLightPath(ctx, lightPosition, RayCaster.getDecisionPoints(lightPosition));
          var success = true;
          for ( var idx = 0; idx != receptors.length; idx++) {
            var receptor = receptors[idx];

            var light = receptor.light;
            var inPath = ctx.isPointInPath(receptor.x, receptor.y);
            var receptorSuccess = (inPath == light);
            if (!receptorSuccess) {
              success = false;
            }
          }
          if (success) {
            succeeded++;
            example = {
              x : x,
              y : y
            };
          } else {
            failed++;
          }
        }
      }
    }
    if (succeeded > 0) {
      this.allReceptors.push({
        receptors : receptors,
        succeeded : succeeded,
        failed : failed,
        example : example

      })
    }

  }
  this.allReceptors.sort(function(a, b) {
    return b.succeeded - a.succeeded;
  });

  this.allReceptors = this.allReceptors.splice(throwAway, totalRequired);
}

GameState.prototype.nextReceptors = function() {
  this.receptors = this.allReceptors[this.receptorsIdx].receptors;
  this.doneFor = 0;
  this.receptorsIdx++;
}

GameState.prototype.getBodies = function() {
  return this.bodies;
}

GameState.prototype.getReceptors = function() {
  return this.receptors;
}

GameState.prototype.getHeight = function() {
  return this.height;
}

GameState.prototype.getWidth = function() {
  return this.width;
}

GameState.prototype.forNeighbours = function(node, f) {
  var x = this.getX(node);
  var y = this.getY(node);

  if (x > 0) {
    f(node - 1);
  }
  if (x < this.width - 1) {
    f(node + 1);
  }
  if (y > 0) {
    f(node - this.width);
  }
  if (y < this.height - 1) {
    f(node + this.width);
  }
}

GameState.prototype.getNode = function(x, y) {
  if (x < 0) {
    return null;
  }
  if (x >= this.width) {
    return null;
  }

  if (y < 0) {
    return null;
  }
  if (y >= this.height) {
    return null;
  }

  return x + y * this.width;
}

GameState.prototype.getX = function(idx) {
  return idx % this.width;
}

GameState.prototype.getY = function(idx) {
  return Math.floor(idx / this.width);
}

GameState.prototype.isBlocked = function(node) {
  return this.grid[node];
}

GameState.prototype.isBlockedXY = function(x, y) {
  var node = this.getNode(x, y);
  if (node == null) {
    return true;
  } else {
    return this.isBlocked(node);
  }
}

GameState.prototype.setLightPosition = function(pos) {
  if (!this.isBlockedXY(Math.floor(pos.x), Math.floor(pos.y))) {
    this.lightPosition = pos;
  }
}

GameState.prototype.getLightPosition = function() {
  return this.lightPosition;
}

GameState.prototype.getDoneDelay = function() {
  return this.doneFor / GameState.DONE_DELAY;
}

GameState.prototype.process = function(delta, renderFeedback) {

  var allDone = true;
  for ( var idx = 0; idx != this.receptors.length; idx++) {
    var receptor = this.receptors[idx];
    if (!renderFeedback.receptorSuccess[idx]) {
      allDone = false;
      break;
    }
  }
  if (allDone) {
    this.doneFor += delta;
    if (this.doneFor >= GameState.DONE_DELAY) {
      this.nextReceptors();
    }
  } else {
    this.doneFor = 0;
  }
}