const { User } = require('../models/users.model.ts');
const { Role } = require('../models/roles.model.ts');

module.exports = function (requiredRole) {
  return async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const user = await User.findById(req.user.id).populate('roleId');
      if (!user || !user.roleId || user.roleId.name !== requiredRole) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      next();
    } catch (error) {
      return res.status(403).json({ message: 'Access denied' });
    }
  };
}; 