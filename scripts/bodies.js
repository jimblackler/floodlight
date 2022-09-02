const Bodies = function (gameState) {
  const done = [];
  const width = gameState.getWidth();
  const height = gameState.getHeight();
  this.bodyArray = [];

  for (let iy = 0; iy !== height + 1; iy++) {
    for (let ix = 0; ix !== width + 1; ix++) {
      if (done[ix + '/' + iy]) {
        continue;
      }
      const body = {
        points: []
      };

      let x = ix;
      let y = iy;
      let px = null;
      let py = null;
      let dy = null;
      do {
        done[x + '/' + y] = true;
        // Scan
        const nw = gameState.isBlockedXY(x - 1, y - 1);
        const ne = gameState.isBlockedXY(x, y - 1);
        const se = gameState.isBlockedXY(x, y);
        const sw = gameState.isBlockedXY(x - 1, y);
        if (px != null) {
          dx = x - px;
          dy = y - py;
        }
        px = x;
        py = y;
        if (nw && ne && se && sw) {
          break;
        } else if (!nw && ne && se && sw) {
          body.points.push({
            x: x,
            y: y
          });
          y--;
        } else if (nw && !ne && se && sw) {
          body.points.push({
            x: x,
            y: y
          });
          x++;
        } else if (!nw && !ne && se && sw) {
          x++;
        } else if (nw && ne && !se && sw) {
          body.points.push({
            x: x,
            y: y
          });
          y++;
        } else if (!nw && ne && !se && sw) {
          // ??
          body.points.push({
            x: x,
            y: y
          });
          if (dx === 1)
            y--;
          else if (dx === -1)
            y++;
          else
            debugger;
        } else if (nw && !ne && !se && sw) {
          y++;
        } else if (!nw && !ne && !se && sw) {
          body.points.push({
            x: x,
            y: y
          });
          y++;
        } else if (nw && ne && se && !sw) {
          body.points.push({
            x: x,
            y: y
          });
          x--;
        } else if (!nw && ne && se && !sw) {
          y--;
        } else if (nw && !ne && se && !sw) {
          // ??
          body.points.push({
            x: x,
            y: y
          });
          if (dy === 1)
            x++;
          else if (dy === -1)
            x--;
          else
            debugger;
        } else if (!nw && !ne && se && !sw) {
          body.points.push({
            x: x,
            y: y
          });
          x++;
        } else if (nw && ne && !se && !sw) {
          x--;
        } else if (!nw && ne && !se && !sw) {
          body.points.push({
            x: x,
            y: y
          });
          y--;
        } else if (nw && !ne && !se && !sw) {
          body.points.push({
            x: x,
            y: y
          });
          x--;
        } else if (!nw && !ne && !se && !sw) {
          break;
        }
      } while (x !== ix || y !== iy);

      if (body.points.length) {
        this.bodyArray.push(body);
      }
    }
  }
};

Bodies.prototype.getBodyArray = function () {
  return this.bodyArray;
};