const { User } = require('../models');
const { signAccessToken } = require('../config/jwt');

// POST /api/diner/auth/register
const register = async (req, res, next) => {
  try {
    // TODO: implement by your teammate
    // Expected req.body: { name, phone, password }
    // NOTE: User model uses `phone` as the unique identifier (not email).
    //       You must also add `passwordHash` column to the User model in models/index.js
    //       before this will work. See integration doc for exact steps.
    // Steps:
    //   1. Validate inputs (name, phone, password all required)
    //   2. Check User.findOne({ where: { phone } }) — return 409 if already exists
    //   3. Hash password: const hash = await bcrypt.hash(password, 12)
    //   4. Create user: User.create({ name, phone, passwordHash: hash })
    //   5. Sign token: signAccessToken({ userId: user.id, role: user.role })
    //   6. Return: res.status(201).json({ user: { id, name, phone }, token })
    res.status(501).json({ error: { code: 501, message: 'Not implemented yet' } });
  } catch (err) { next(err); }
};

// POST /api/diner/auth/login
const login = async (req, res, next) => {
  try {
    // TODO: implement by your teammate
    // Expected req.body: { phone, password }
    // Steps:
    //   1. Find user: User.findOne({ where: { phone } }) — return 401 if not found
    //   2. Compare: const match = await bcrypt.compare(password, user.passwordHash)
    //   3. Return 401 if match is false (use a generic message — don't reveal which field is wrong)
    //   4. Update last login: user.update({ lastLogin: new Date() })
    //   5. Sign token: signAccessToken({ userId: user.id, role: user.role })
    //   6. Return: res.json({ user: { id, name, phone }, token })
    res.status(501).json({ error: { code: 501, message: 'Not implemented yet' } });
  } catch (err) { next(err); }
};

// GET /api/diner/auth/me  (requires valid JWT in Authorization header)
const me = async (req, res, next) => {
  try {
    // TODO: implement by your teammate
    // req.diner is already set by requireAuth middleware: { userId, role }
    // Steps:
    //   1. Fetch user: const user = await User.findByPk(req.diner.userId)
    //   2. Return 404 if user not found or user.isActive === false
    //   3. Return: res.json({ user: { id: user.id, name: user.name, phone: user.phone } })
    res.status(501).json({ error: { code: 501, message: 'Not implemented yet' } });
  } catch (err) { next(err); }
};

module.exports = { register, login, me };
