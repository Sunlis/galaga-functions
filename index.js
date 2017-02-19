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

var handleDetail = function(req, res, db) {
  if (!checkParams(req, res, ['id'])) {
    return;
  }
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
  if (!checkParams(req, res, ['name'])) {
    return;
  }
  db.query('SELECT * FROM `systems`.`systems` WHERE `name` LIKE ? LIMIT 20',
    ['%' + sanitize(req.query.name) + '%'],
    function(error, results, fields) {
      if (!checkError(res, error)) {
        jsonResponse(res, 200, results);
      }
    });
};

var sanitize = function(txt) {
  return txt.replace(/[^a-zA-Z0-9\-'\s]/g, '');
};

var jsonResponse = function(res, status, obj) {
  res.status(status).send(JSON.stringify(obj));
};

var checkParams = function(req, res, props) {
  var missing = [];
  for (var prop in props) {
    if (!req.query[prop]) {
      missing.push(prop);
    }
  }
  if (missing) {
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
