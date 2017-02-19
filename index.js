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
    res.status(500).send(JSON.stringify({
      'error': '/shrug'
    }));
  }
  db.end();
};

exports.detail = function(req, res) {
  var db = connect('systems');
  try {
    handleDetail(req, res, db);
  } catch (e) {
    console.error(JSON.stringify(e));
    res.status(500).send(JSON.stringify({
      'error': '/shrug'
    }));
  }
  db.end();
};

var handleDetail = function(req, res, db) {
  if (!req.query.id) {
    res.status(400).send(JSON.stringify({
      'error': 'Must provide `id` query param for detail'
    }));
    return;
  }
  db.query(
    'SELECT * FROM `systems`.`system_detail` WHERE `id`=?',
    [sanitize(req.query.id)],
    function(error, results, fields) {
      if (error) {
        console.error(error);
        res.status(500).send(JSON.stringify({
          'error': 'error querying db (see logs)'
        }));
      } else {
        res.status(200).send(JSON.stringify(results));
      }
    });
};

var handleLookup = function(req, res, db) {
  if (!req.query.name) {
    res.status(400).send(JSON.stringify({
      'error': 'Must provide `name` query param for lookup'
    }));
    return;
  }
  console.log('requested ' + req.query.name);
  db.query('SELECT * FROM `systems`.`systems` WHERE `name` LIKE ? LIMIT 20',
    ['%' + sanitize(req.query.name) + '%'],
    function(error, results, fields) {
      console.log('results: ' + JSON.stringify(results));
      if (error) {
        console.error(error);
        res.status(500).send(JSON.stringify({
          'error': 'error querying db (see logs)'
        }));
      } else {
        var mapped = results.map(function(item) {
          var obj = {};
          for (var key in item) {
            obj[key] = item[key];
          }
          return obj;
        });
        res.status(200).send(JSON.stringify(mapped));
      }
    });
};

var sanitize = function(txt) {
  return txt.replace(/[^a-zA-Z0-9\-'\s]/g, '');
};
