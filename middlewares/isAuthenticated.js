/**
 * Middleware to verify that the user has an active authenticated session.
 */
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  req.flash('error', 'Please log in to access this page.');
  return res.redirect('/login');
}

module.exports = isAuthenticated;
