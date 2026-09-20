/**
 * Middleware factory to authorize specific user roles.
 * @param {...string} allowedRoles - e.g. 'admin', 'agent', 'customer'
 */
function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      req.flash('error', 'Please log in to continue.');
      return res.redirect('/login');
    }

    const userRole = req.session.user.role;
    if (!allowedRoles.includes(userRole)) {
      req.flash('error', `Access denied: Requires ${allowedRoles.join(' or ')} permission.`);
      
      // Redirect to their appropriate dashboard based on actual role
      if (userRole === 'admin') return res.redirect('/admin/dashboard');
      if (userRole === 'agent') return res.redirect('/agent/dashboard');
      return res.redirect('/customer/dashboard');
    }

    next();
  };
}

module.exports = authorizeRole;
