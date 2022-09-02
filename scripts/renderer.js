const Renderer = function (gameDiv, size) {
  this.GRID_SIZE = size == null ? 32 : size;
  this.canvas = document.createElement("canvas");
  gameDiv.appendChild(this.canvas);
};

Renderer.prototype.render = function (gameState) {
  const width = gameState.getWidth();
  const height = gameState.getHeight();
  this.canvas.width = width * this.GRID_SIZE;
  this.canvas.height = height * this.GRID_SIZE;

  const outer = this;
  this.canvas.onmousedown = function (e) {
    this.mouseDown = true;
    gameState.setLightPosition({
      x: (e.clientX - outer.canvas.offsetLeft) / outer.GRID_SIZE,
      y: (e.clientY - outer.canvas.offsetTop) / outer.GRID_SIZE
    });
  };

  this.canvas.onmouseup = function (e) {
    this.mouseDown = false;
  };

  this.canvas.onmousemove = function (e) {
    if (this.mouseDown) {
      gameState.setLightPosition({
        x: (e.clientX - outer.canvas.offsetLeft) / outer.GRID_SIZE,
        y: (e.clientY - outer.canvas.offsetTop) / outer.GRID_SIZE
      });
    }
  };

  let ctx = this.canvas.getContext("2d");

  if (true) { // draw traced bodies
    if (!this.bodiesImage) {
      this.bodiesImage = document.createElement('canvas');
      this.bodiesImage.width = width * this.GRID_SIZE;
      this.bodiesImage.height = height * this.GRID_SIZE;

      ctx = this.bodiesImage.getContext('2d');
      ctx.scale(this.GRID_SIZE, this.GRID_SIZE);

      ctx.fillStyle = "rgba(0, 32, 0, 1)";
      ctx.fillRect(0, 0, width, height);

      if (true) { // Draw fancy grid
        ctx.beginPath();
        for (let y = 0; y !== height; y++) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        for (let x = 0; x !== width; x++) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        ctx.strokeStyle = "rgba(0,0,0,0.8)"
        ctx.lineWidth = 0.03;
        ctx.stroke();
      }

      var bodies = gameState.getBodies().getBodyArray();
      ctx.beginPath();
      for (let idx = 0; idx !== bodies.length; idx++) {
        var body = bodies[idx];
        var points = body.points;

        for (let idx2 = 0; idx2 !== points.length; idx2++) {
          var point = points[idx2];
          if (idx2 === 0)
            ctx.moveTo(point.x, point.y);
          else
            ctx.lineTo(point.x, point.y);
          if (point.x === 0 && point.y === 0) {
            ctx.lineTo(width, 0);
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.lineTo(0, 0);
          }
        }
        ctx.closePath();

      }

      if (true) {
        ctx.save();
        ctx.shadowColor = "black";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 8;
        ctx.shadowOffsetY = 8;
        ctx.fillStyle = "rgba(200,180,120,0.8)";
        ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = "rgba(0,0,0,0.4)"
      ctx.lineWidth = 0.1575;
      ctx.stroke();

      // Restore context
      ctx = this.canvas.getContext("2d");
    }

    ctx.drawImage(this.bodiesImage, 0, 0);

  }

  ctx.scale(this.GRID_SIZE, this.GRID_SIZE);

  if (false) { // draw original blocks
    ctx.fillStyle = "rgba(100,120,100,0.5)";

    let node = 0;
    for (let y = 0; y !== height; y++) {
      for (let x = 0; x !== width; x++) {
        if (gameState.isBlocked(node)) {
          ctx.fillRect(x, y, 1, 1);
        }
        node++;
      }
    }
  }

  if (false) { // draw corner vertices
    ctx.fillStyle = "rgba(0,128,0,0.9)";

    var bodies = gameState.getBodies().getBodyArray();
    for (let idx = 0; idx != bodies.length; idx++) {
      var body = bodies[idx];
      var points = body.points;
      for (let idx2 = 0; idx2 != points.length; idx2++) {
        ctx.beginPath();
        ctx.arc(points[idx2].x, points[idx2].y, 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Render light
  var lightPosition = gameState.getLightPosition();
  if (lightPosition) {
    const data = RayCaster.getDecisionPoints(lightPosition);

    if (false) { // visualize decision points in original order
      ctx.lineWidth = 0.25;
      for (let idx = 0; idx !== data.decisionPoints.length; idx++) {
        const decisionPoint = data.decisionPoints[idx];
        var body = decisionPoint.body;
        const bodyPoints = body.points;
        var point = bodyPoints[decisionPoint.idx];
        if (decisionPoint.mode === RayCaster.Modes.STARTS) {
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
          if (decisionPoint.mode === RayCaster.Modes.ENDS) {
            ctx.strokeStyle = ["rgba(255,0,0,0.5)", "rgba(0,255,0,0.5)", "rgba(0,0,255,0.5)",
              "rgba(0,255,255,0.5)", "rgba(255,0,255,0.5)", "rgba(255,255,0,0.5)"][decisionPoint.sequence % 6];
            ctx.stroke();
          }
        }
      }
    }

    RayCaster.loadLightPath(ctx, lightPosition, data);
    const gradient = ctx.createRadialGradient(lightPosition.x, lightPosition.y, 0.1, lightPosition.x,
        lightPosition.y, Math.max(width, height));
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.2, "rgba(255,255,255,0.58)");
    gradient.addColorStop(1, "rgba(255,255,255,0.25)");
    ctx.fillStyle = gradient;
    ctx.fill();

  }

  const renderFeedback = {
    receptorSuccess: []
  };
  if (true) { // show receptors
    if (!this.sprites) {
      this.sprites = new Image();
      this.sprites.src = "sprites.png";
    }
    const receptors = gameState.getReceptors();
    for (let idx = 0; idx !== receptors.length; idx++) {
      ctx.save();
      const receptor = receptors[idx];

      const light = receptor.light;
      const inPath = ctx.isPointInPath(receptor.x * this.GRID_SIZE, receptor.y * this.GRID_SIZE);
      renderFeedback.receptorSuccess[idx] = (inPath === light);
      const notLitAlpha = 0.5;
      if (inPath) {
        ctx.shadowColor = "yellow";
        ctx.shadowBlur = 20 + 20 * gameState.getDoneDelay();
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.globalAlpha = notLitAlpha + (1 - notLitAlpha) * gameState.getDoneDelay();
      } else {
        ctx.globalAlpha = notLitAlpha;
      }
      const size = inPath ? 1.1 : 0.9;
      ctx.drawImage(this.sprites, light ? 0 : 64, 0, 64, 64, receptor.x - size / 2, receptor.y
          - size / 2, size, size);
      ctx.restore();
    }

  }

  if (true) { // show light origin
    var lightPosition = gameState.getLightPosition();
    if (lightPosition) {
      ctx.fillStyle = "rgba(0,128,128,0.9)";
      ctx.beginPath();
      ctx.arc(lightPosition.x, lightPosition.y, 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return renderFeedback;
};
