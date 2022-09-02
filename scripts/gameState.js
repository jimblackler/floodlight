const DONE_DELAY = 2 * 1000;

class GameState {

  width;
  height;
  receptors;
  doneFor;
  receptorsIdx;

  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.grid = [];
  };

  generateWalls(seed) {

    if (seed) {
      window.random = new Alea(seed);
    } else {
      window.random = new Alea();
    }
    const outer = this;
    if (false) { // Method one
      // seed
      for (let idx = 0; idx !== this.width * this.height; idx++) {
        this.grid[idx] = random() < .025;
      }

      // spread
      for (let pass = 0; pass !== 4; pass++) {
        for (let idx = 0; idx !== this.width * this.height; idx++) {

          this.forNeighbours(idx, function (neighbour) {
            if (outer.grid[neighbour] && random() < .15) {
              outer.grid[idx] = true;
            }
          });
        }
      }
    } else {

      for (let walls = 0; walls !== 35; walls++) {
        let x;
        let y;
        for (let attempts = 0; attempts !== 4; attempts++) {
          x = Math.floor(random() * this.width / 3) * 3;
          y = Math.floor(random() * this.height / 3) * 3;
          const node = outer.getNode(x, y);
          if (outer.grid[node]) {
            break;
          }
        }

        let dx;
        let dy;
        const r = random();
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
        let length = Math.floor(random() * 2 + 1) * 3;
        while (length--) {
          const node = outer.getNode(x, y);
          if (node == null) {
            break;
          }
          if (x === 0 && y === 0) {
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

  }

  generateReceptors() {
    // Use dead-reckoning to discover valid light positions.
    const ctx = document.createElement('canvas').getContext('2d');
    const totalRequired = 10;
    const throwAway = 5;
    const targets = totalRequired + throwAway;
    this.allReceptors = [];
    const minDistance = 7;
    while (this.allReceptors.length < targets) {
      const receptors = [];
      for (let count = 0; count < 5; count++) {
        while (true) {
          const x = Math.floor(random() * this.width) + .5;
          const y = Math.floor(random() * this.height) + .5;
          if (this.isBlockedXY(Math.floor(x), Math.floor(y))) {
            continue;
          }
          let valid = true;
          const light = (count !== 0);
          for (let idx = 0; idx !== receptors.length; idx++) {
            const other = receptors[idx];
            if (light === other.light) {
              const distance = (x - other.x) * (x - other.x) + (y - other.y) * (y - other.y);
              if (distance < minDistance * minDistance) {
                valid = false;
                break;
              }
            }
          }
          if (valid) {
            receptors.push({
              x: x,
              y: y,
              light: light
            });
            break;
          }
        }
      }

      let failed = 0;
      let succeeded = 0;
      let example;
      for (let y = 0; y !== this.height; y++) {
        for (let x = 0; x !== this.width; x++) {
          if (!this.isBlockedXY(x, y)) {
            const lightPosition = {
              x: x + .5,
              y: y + .5
            };
            RayCaster.loadLightPath(ctx, lightPosition, RayCaster.getDecisionPoints(lightPosition));
            let success = true;
            for (let idx = 0; idx !== receptors.length; idx++) {
              const receptor = receptors[idx];

              const light = receptor.light;
              const inPath = ctx.isPointInPath(receptor.x, receptor.y);
              const receptorSuccess = (inPath === light);
              if (!receptorSuccess) {
                success = false;
              }
            }
            if (success) {
              succeeded++;
              example = {
                x: x,
                y: y
              };
            } else {
              failed++;
            }
          }
        }
      }
      if (succeeded > 0) {
        this.allReceptors.push({
          receptors,
          succeeded,
          failed,
          example
        })
      }
    }
    this.allReceptors.sort(function (a, b) {
      return b.succeeded - a.succeeded;
    });

    this.allReceptors = this.allReceptors.splice(throwAway, totalRequired);


  }

  nextReceptors() {
    this.receptors = this.allReceptors[this.receptorsIdx].receptors;
    this.doneFor = 0;
    this.receptorsIdx++;
  }

  getBodies() {
    return this.bodies;
  }

  getReceptors() {
    return this.receptors;
  }

  getHeight() {
    return this.height;
  }


  getWidth() {
    return this.width;
  }

  forNeighbours(node, f) {
    const x = this.getX(node);
    const y = this.getY(node);

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

  getNode(x, y) {
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

  getX(idx) {
    return idx % this.width;
  }

  getY(idx) {
    return Math.floor(idx / this.width);
  }

  isBlocked(node) {
    return this.grid[node];
  }

  isBlockedXY(x, y) {
    const node = this.getNode(x, y);
    if (node == null) {
      return true;
    } else {
      return this.isBlocked(node);
    }
  }

  setLightPosition(pos) {
    if (!this.isBlockedXY(Math.floor(pos.x), Math.floor(pos.y))) {
      this.lightPosition = pos;
    }
  }

  getLightPosition() {
    return this.lightPosition;
  }

  getDoneDelay() {
    return this.doneFor / DONE_DELAY;
  }

  process(delta, renderFeedback) {
    let allDone = true;
    for (let idx = 0; idx !== this.receptors.length; idx++) {
      if (!renderFeedback.receptorSuccess[idx]) {
        allDone = false;
        break;
      }
    }
    if (allDone) {
      this.doneFor += delta;
      if (this.doneFor >= DONE_DELAY) {
        this.nextReceptors();
      }
    } else {
      this.doneFor = 0;
    }
  }
}