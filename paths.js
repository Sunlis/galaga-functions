
var findPath = function(req, res, db, start, end) {
  var padding = 20;
  var minX = Math.min(start.x, end.x) - padding, maxX = Math.max(start.x, end.x) + padding,
      minY = Math.min(start.y, end.y) - padding, maxY = Math.max(start.y, end.y) + padding,
      minZ = Math.min(start.z, end.z) - padding, maxZ = Math.max(start.z, end.z) + padding;
  db.query(
    'SELECT * FROM `systems`.`system_detail` WHERE `x` BETWEEN ? AND ? AND  `y` BETWEEN ? AND ? AND  `z` BETWEEN ? AND ?',
    [minX, maxX, minY, maxY, minZ, maxZ],
    function(error, results, fields) {
      if (!checkError(res, error)) {

      }
    });
};

var db = null,
    systems = {},
    open = {},
    closed = {},
    from = {},
    gScore = {},
    fScore = {},
    safety = 0;

/**
 * Get a system from the cache, or query the DB and add to cache.
 * Async because of the mysql api.
 * @return {!Promise}
 */
var getSystem = function(id) {
  return new Promise(function(resolve, reject) {
    if (!systems[id]) {
      db.query('SELECT * FROM `systems`.`system_detail` WHERE id=?', [id], function(err, results) {
        for (var i = 0; i < results.length; i++) {
          systems[results[i].id] = results[i];
        }
        resolve(systems[id]);
      });
    } else {
      resolve(systems[id]);
    }
  });
};

var getSystemFromCache = function(id) {
  return systems[id];
};

var getNeighbours = function(id) {
  return new Promise(function(resolve, reject) {
    getSystem(id).then(function(node) {
      var padding = 50;
      db.query(
        'SELECT * FROM `systems`.`system_detail` WHERE ' +
          '`x` BETWEEN ? AND ? AND' +
          '`y` BETWEEN ? AND ? AND' +
          '`z` BETWEEN ? AND ?',
        [node.x - padding, node.x + padding,
         node.y - padding, node.y + padding,
         node.z - padding, node.z + padding],
        function(error, results, fields) {
          var neighbours = [];
          for (var i = 0; i < results.length; i++) {
            systems[results[i].id] = results[i];
            if (!closed[results[i].id]) {
              neighbours.push(results[i]);
            }
          }
          resolve(neighbours);
        });
    });
  });
};

exports.aStar = function(start, goal, connection) {
  db = connection;

  closed = {};
  open = {};
  open[start] = true;
  from = {};

  gScore = {};
  gScore[start] = 0;
  fScore = {};
  fScore[start] = heuristic(start, goal, data);

  safety = 0;

  var path = iterPath(goal);
  return parsePath(path);
};

var tracePath = function(goal) {
  var current = goal;
  var path = [current];
  while (from[current]) {
    current = from[current];
    path.push(current);
  }
  return path;
};

var iterPath = function (goal) {
  if (Object.keys(open).length == 0) {
    console.error('ran out of open nodes');
    return;
  }

  safety++;
  if (safety > 10000) {
    console.error('broke safety');
    return;
  }
  var current = null;
  // get open node with lowest fScore
  for (var key in open) {
    if (!current || fScore[key] < fScore[current]) {
      current = key;
    }
  }

  if (current == goal) {
    return tracePath(goal);
  };

  delete open[current];
  closed[current] = true;

  return getSystem(current).then(function(node) {
    return getNeighbours(current).then(function(neighbours) {
      for (var i = 0; i < neighbours.length; i++) {
        var neighbour = neighbours[i];
        var tempScore = gScore[current] + nodeDist(node, neighbour);
        if (!open[neighbour.id]) {
          open[neighbour.id] = true;
        } else if (gScore[neighbour.id] != undefined &&
          tempScore >= gScore[neighbour.id]) {
          continue;
        }
        from[neighbour.id] = current;
        gScore[neighbour.id] = tempScore;
        fScore[neighbour.id] = gScore[neighbour.id] + heuristic(neighbour.id, goal, data);
      }
      return iterPath(goal);
    });
  });
};

exports.parsePath = function(path) {
  return path.map(function(id) {
    var system = getSystemFromCache(id);
    return {
      id: system.id,
      name: system.name,
      x: system.x,
      y: system.y,
      z: system.z,
    };
  });
};

var heuristic = function(start, goal, data) {
  var startNode = getNode(start, data),
      goalNode = getNode(goal, data);
  return nodeDist(startNode, goalNode);
};

var nodeDist = function(a, b) {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) +
    Math.pow(a.y - b.y, 2) +
    Math.pow(a.z - b.z, 2));
};

var getNode = function(id, data) {
  for (var i = 0; i < data.length; i++) {
    if (data[i].id == id) return data[i];
  }
};

var getNeighbours = function(node, closed, data) {
  var neighbours = [];
  for (var i = 0; i < data.length; i++) {
    if (data[i].id != node.id &&
        !closed[data[i].id] &&
        nodeDist(node, data[i]) < 20) {
      neighbours.push(data[i]);
    }
  }
  return neighbours;
};
