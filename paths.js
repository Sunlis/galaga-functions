exports.aStar = function(start, goal, data) {
  var closed = {};
  var open = {};
  open[start] = true;
  var from = {};

  var gScore = {};
  gScore[start] = 0;
  var fScore = {};
  fScore[start] = heuristic(start, goal, data);

  var current;

  var safety = 0;
  while (Object.keys(open).length != 0) {
    safety++;
    if (safety > 100) {
      break;
    }
    current = null;
    // get open node with lowest fScore
    for (var key in open) {
      if (!current || fScore[key] < fScore[current]) {
        current = key;
      }
    }

    delete open[current];
    closed[current] = true;
    var node = getNode(current, data);

    var neighbours = getNeighbours(node, closed, data);
    for (var i = 0; i < neighbours.length; i++) {
      var neighbour = neighbours[i];
      var tempScore = gScore[current] + nodeDist(node, neighbour);
      if (!open[neighbour.id]) open[neighbour.id] = true;
      else if (gScore[neighbour.id] != undefined && tempScore >= gScore[neighbour.id]) {
        continue;
      }
      from[neighbour.id] = current;
      gScore[neighbour.id] = tempScore;
      fScore[neighbour.id] = gScore[neighbour.id] + heuristic(neighbour.id, goal, data);
    }
  }

  var path = [current];
  while (from[current]) {
    current = from[current];
    path.push(current);
  }
  return path;
};

exports.parsePath = function(path, data) {
  return path.map(function(id) {
    return getNode(id, data);
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
