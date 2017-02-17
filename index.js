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

/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
exports.lookup = function(req, res) {
  var db = connect('systems');
  try {
    handleLookup(req, res, db);
  } catch (e) {
    console.error(e);
    res.status(500).send(JSON.stringify({
      'error': 'Couldn\'t connect to db'
    }));
  }
  db.end();
};

var handleLookup = function(req, res, db) {
  if (!req.query.name) {
    res.status(400).send(JSON.stringify({
      error: 'Must provide `name` query param for lookup'
    }));
    return;
  }
  console.log('requested ' + req.query.name);
  db.query('SELECT * FROM `systems`.`systems` WHERE `name` LIKE ?',
    ['%' + sanitize(req.query.name) + '%'],
    function(error, results, fields) {
      console.log('results: ' + JSON.stringify(results));
      if (error) {
        console.error(error);
        res.status(500).send(JSON.stringify({
          'error': 'error querying db (see logs)'
        }));
      } else if (results) {
        res.send(200).send(JSON.stringify(results.map(function(item) {
          	var obj = {};
          	for (var key in item) {
              obj[key] = item[key];
            }
            return obj;
          })));
      }
    });
};

var sanitize = function(txt) {
  return txt.replace(/[^a-zA-Z0-9\-'\s]/g, '');
};

