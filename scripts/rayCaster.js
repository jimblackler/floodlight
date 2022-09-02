const RayCaster = {
  Modes: {
    NOT_STARTED: 0,
    STARTS: 1,
    CONTINUES: 2,
    ENDS: 3
  },

  getDecisionPoints: function (lightPosition) {
    const data = {
      liveDecisionPoints: {},
      decisionPoints: []
    };

    let sequence = 0;
    const bodies = gameState.getBodies().getBodyArray();
    for (let idx = 0; idx !== bodies.length; idx++) {
      const body = bodies[idx];
      const points = body.points;
      const pointData = {
        idx: 0
      };
      let previous = null;
      let remain = null;
      let mode = RayCaster.Modes.NOT_STARTED;
      do {
        const point = points[pointData.idx];
        const dx = point.x - lightPosition.x;
        const dy = point.y - lightPosition.y;

        pointData.angle = Math.atan2(dy, dx);
        if (previous != null) {
          let delta = pointData.angle - previous.angle;
          while (delta >= Math.PI) {
            delta -= Math.PI * 2;
          }
          while (delta < -Math.PI) {
            delta += Math.PI * 2;
          }

          if (delta < 0) {
            if (remain != null) {
              if (mode === RayCaster.Modes.NOT_STARTED) {
                mode = RayCaster.Modes.STARTS;
              } else if (mode === RayCaster.Modes.STARTS) {
                mode = RayCaster.Modes.CONTINUES;
              }
              if (remain === 0) {
                mode = RayCaster.Modes.ENDS;
              }
            }
          } else if (mode === RayCaster.Modes.STARTS || mode === RayCaster.Modes.CONTINUES) {
            mode = RayCaster.Modes.ENDS;
          } else if (remain == null) {
            remain = points.length;
          }
          if (mode !== RayCaster.Modes.NOT_STARTED) {
            const decisionPoint = {
              angle: previous.angle,
              mode: mode,
              body: body,
              sequence: sequence,
              idx: previous.idx,
              nextIdx: pointData.idx
            };
            data.decisionPoints.push(decisionPoint);
            if (previous.angle < -Math.PI / 2 && pointData.angle >= Math.PI / 2) {
              data.liveDecisionPoints[decisionPoint.sequence + "/" + decisionPoint.nextIdx] = decisionPoint;
            }
          }
          if (mode === RayCaster.Modes.ENDS) {
            mode = RayCaster.Modes.NOT_STARTED;
            sequence++;
          }
        }
        if (pointData.idx === 0 && previous != null) {
          // Interior buster- some errant cases seen
          if (remain == null) {
            remain = points.length + 1;
          }
        }
        previous = {
          angle: pointData.angle,
          idx: pointData.idx
        };
        pointData.idx++;
        if (pointData.idx === points.length) {
          pointData.idx = 0;
        }
      } while (remain == null || remain-- > 0);
    }
    return data;
  },

  loadLightPath: function (ctx, lightPosition, data) {

    data.decisionPoints.sort(function (a, b) {
      let result = b.angle - a.angle;
      if (result === 0) {
        result = a.mode - b.mode;
      }
      return result;
    });

    ctx.beginPath();

    // Find nearest.
    let closestDecisionPoint = null;
    let closestPosition;
    let closestDistance = Number.MAX_VALUE;
    for (idx0 in data.liveDecisionPoints) {
      const candidateDecisionPoint = data.liveDecisionPoints[idx0];
      const collisionPoint =
          RayCaster.getCollisionPoint(candidateDecisionPoint, lightPosition, Math.PI);
      const dx0 = collisionPoint.x - lightPosition.x;
      const dy0 = collisionPoint.y - lightPosition.y;
      const distance = dx0 * dx0 + dy0 * dy0;
      if (distance < closestDistance) {
        closestDistance = distance;
        closestDecisionPoint = candidateDecisionPoint;
        closestPosition = collisionPoint;
      }
    }
    if (closestDecisionPoint != null) {

      let activeDecisionPoint = closestDecisionPoint;

      for (let idx = 0; idx !== data.decisionPoints.length; idx++) {
        const decisionPoint = data.decisionPoints[idx];
        delete data.liveDecisionPoints[decisionPoint.sequence + "/" + decisionPoint.idx];
        if (decisionPoint.mode !== RayCaster.Modes.ENDS) {
          data.liveDecisionPoints[decisionPoint.sequence + "/" + decisionPoint.nextIdx] =
              decisionPoint;
        }
        if (decisionPoint.mode === RayCaster.Modes.STARTS) {
          // Should hook on to new start point?
          const body = decisionPoint.body;
          const bodyPoints = body.points;
          const position = bodyPoints[decisionPoint.idx];

          const dx0a = position.x - lightPosition.x;
          const dy0a = position.y - lightPosition.y;
          const candidateDistance = dx0a * dx0a + dy0a * dy0a;

          const currentPosition = RayCaster.getCollisionPoint(activeDecisionPoint, lightPosition,
              decisionPoint.angle);
          const dx0 = currentPosition.x - lightPosition.x;
          const dy0 = currentPosition.y - lightPosition.y;
          const currentDistance = dx0 * dx0 + dy0 * dy0;
          if (candidateDistance <= currentDistance) {
            ctx.lineTo(currentPosition.x, currentPosition.y);
            activeDecisionPoint = decisionPoint;
            ctx.lineTo(position.x, position.y);
          }
        }

        // Traverse existing wall.
        if (activeDecisionPoint != null && activeDecisionPoint.sequence === decisionPoint.sequence
            && activeDecisionPoint.nextIdx === decisionPoint.idx) {
          activeDecisionPoint = decisionPoint;
          const body = decisionPoint.body;
          const bodyPoints = body.points;
          const point = bodyPoints[decisionPoint.idx];
          ctx.lineTo(point.x, point.y);

          if (decisionPoint.mode === RayCaster.Modes.ENDS) {
            // Loose scanner .. hook on to nearest.
            let closestDecisionPoint = null;
            let closestPosition;
            let closestDistance = Number.MAX_VALUE;
            for (idx0 in data.liveDecisionPoints) {
              const candidateDecisionPoint = data.liveDecisionPoints[idx0];
              const collisionPoint = RayCaster.getCollisionPoint(candidateDecisionPoint,
                  lightPosition, decisionPoint.angle);
              const dx0 = collisionPoint.x - lightPosition.x;
              const dy0 = collisionPoint.y - lightPosition.y;
              const distance = dx0 * dx0 + dy0 * dy0;
              if (distance < closestDistance) {
                closestDistance = distance;
                closestDecisionPoint = candidateDecisionPoint;
                closestPosition = collisionPoint;
              }
            }
            if (closestDecisionPoint == null) {
              //debugger;
              break;
            } else {
              // Scan to hit point.
              ctx.lineTo(closestPosition.x, closestPosition.y);
              activeDecisionPoint = closestDecisionPoint;
            }

          }
        }
      }
      ctx.closePath();
    }

  },

  getCollisionPoint: function (decisionPoint, light, angle) {
    const body = decisionPoint.body;
    const bodyPoints = body.points;
    const a = bodyPoints[decisionPoint.idx];
    const b = bodyPoints[decisionPoint.nextIdx];
    const a0 = (a.x - light.x) * Math.sin(angle) - (a.y - light.y) * Math.cos(angle);
    const b0 = (b.x - light.x) * Math.sin(angle) - (b.y - light.y) * Math.cos(angle);
    const ab0 = b0 - a0;
    const t = -a0 / ab0;
    return {
      x: (b.x - a.x) * t + a.x,
      y: (b.y - a.y) * t + a.y
    };
  }

};
