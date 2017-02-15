/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
exports.lookup = function(req, res) {
  if (!req.query.name) {
    res.status(400).send(JSON.stringify({
      error: 'Must provide `name` query param for lookup'
    }));
  } else {
    res.status(200).send(JSON.stringify({
      message: 'You asked for `' + req.query.name + '`'
    }));
  }
};
