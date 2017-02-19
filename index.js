var mysql = require('mysql');

var connect = function(db) {
  var connection = mysql.createConnection({
  	host: '130.211.159.247',
  	user: 'readonly',
    password: 'readonly',
    database: db
  });
  connection.connect();
  return connection;
};

exports.lookup = function(req, res) {
  var db = connect('systems');
  try {
    handleLookup(req, res, db);
  } catch (e) {
    console.error(JSON.stringify(e));
    jsonResponse(res, 500, {
      'error': '/shrug'
    });
  }
  db.end();
};

exports.detail = function(req, res) {
  var db = connect('systems');
  try {
    handleDetail(req, res, db);
  } catch (e) {
    console.error(JSON.stringify(e));
    jsonResponse(res, 500, {
      'error': '/shrug'
    });
  }
  db.end();
};

exports.path = function(req, res) {
  var db = connect('systems');
  try {
    handlePath(req, res, db);
  } catch (e) {
    console.error(JSON.stringify(e));
    jsonResponse(res, 500, {
      'error': '/shrug'
    });
  }
  db.end();
};

var handlePath = function(req, res, db) {
  if (!checkParams(req, res, ['start', 'end'])) return;
  var startId = sanitize(req.query.start, true);
  var endId = sanitize(req.query.end, true);
  db.query(
    'SELECT * FROM `systems`.`system_detail` WHERE `id`=? OR `id`=?',
    [startId, endId],
    function(error, results, fields) {
      if (!checkError(res, error)) {
        var start, end;
        for (var i = 0; i < results.length; i++) {
          if (results[i].id == startId) {
            start = results[i];
          } else if (results[i].id == endId) {
            end = results[i];
          }
        }
        findPath(req, res, db, start, end);
      }
    });
};

var findPath = function(req, res, db, start, end) {
  var minX = Math.min(start.x, end.x), maxX = Math.max(start.x, end.x),
      minY = Math.min(start.y, end.y), maxY = Math.max(start.y, end.y),
      minZ = Math.min(start.z, end.z), maxZ = Math.max(start.z, end.z);
  db.query(
    'SELECT * FROM `systems`.`system_detail` WHERE `x` BETWEEN ? AND ? AND  `y` BETWEEN ? AND ? AND  `z` BETWEEN ? AND ?',
    [minX, maxX, minY, maxY, minZ, maxZ],
    function(error, results, fields) {
      if (!checkError(res, error)) {
        jsonResponse(res, 200, results);
      }
    });
};

var handleDetail = function(req, res, db) {
  if (!checkParams(req, res, ['id'])) return;
  db.query(
    'SELECT * FROM `systems`.`system_detail` WHERE `id`=?',
    [sanitize(req.query.id)],
    function(error, results, fields) {
      if (!checkError(res, error)) {
        jsonResponse(res, 200, results);
      }
    });
};

var handleLookup = function(req, res, db) {
  if (!checkParams(req, res, ['name'])) return;
  db.query('SELECT * FROM `systems`.`systems` WHERE `name` LIKE ? LIMIT 20',
    ['%' + sanitize(req.query.name) + '%'],
    function(error, results, fields) {
      if (!checkError(res, error)) {
        jsonResponse(res, 200, results);
      }
    });
};

var sanitize = function(txt, onlyNum) {
  if (onlyNum) {
    return txt.replace(/[^0-9]/g,'');
  } else {
    return txt.replace(/[^a-zA-Z0-9\-'\s]/g, '');
  }
};

var jsonResponse = function(res, status, obj) {
  res.status(status).send(JSON.stringify(obj));
};

var checkParams = function(req, res, props) {
  var missing = [];
  for (var i = 0; i < props.length; i++) {
    if (!req.query[props[i]]) {
      missing.push(props[i]);
    }
  }
  if (missing.length) {
    jsonResponse(res, 400, {
      'error': 'Missing required query param(s): ' + missing.join(', ')
    });
    return false;
  }
  return true;
};

var checkError = function(res, error) {
  if (error) {
    console.error(error);
    jsonResponse(res, 500, {
      'error': 'error querying db (see logs)'
    });
    return true;
  }
  return false;
};
