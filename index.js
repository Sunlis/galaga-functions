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
    res.status(500).send(JSON.stringify({
      'error': 'Couldn\'t connect to db'
    }));
    console.error(e);
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
  db.query(
    'SELECT * FROM `systems` WHERE `name` LIKE "%?%"',
    [req.query.name],
    function(error, results, fields) {
      if (error) {
        console.error(error);
        res.status(500).send(JSON.stringify({
          'error': 'error querying db'
        }));
      } else if (results) {
        res.status(200).send(JSON.stringify(results));
      }
    });
};
