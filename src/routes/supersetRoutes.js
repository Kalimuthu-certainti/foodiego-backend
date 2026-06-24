const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');

router.get('/guest-token', authMiddleware, async (req, res) => {
  const SUPERSET_URL = process.env.SUPERSET_URL;
  const SUPERSET_USERNAME = process.env.SUPERSET_USERNAME;
  const SUPERSET_PASSWORD = process.env.SUPERSET_PASSWORD;
  const SUPERSET_DASHBOARD_ID = process.env.SUPERSET_DASHBOARD_ID;

  try {
    const loginRes = await fetch(`${SUPERSET_URL}/api/v1/security/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: SUPERSET_USERNAME,
        password: SUPERSET_PASSWORD,
        provider: 'db',
        refresh: true,
      }),
    });

    if (!loginRes.ok) {
      return res.status(502).json({ success: false, message: 'Failed to authenticate with Superset' });
    }

    const { access_token } = await loginRes.json();

    const guestRes = await fetch(`${SUPERSET_URL}/api/v1/security/guest_token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        user: { username: 'guest', first_name: 'Guest', last_name: 'User' },
        resources: [{ type: 'dashboard', id: SUPERSET_DASHBOARD_ID }],
        rls: [],
      }),
    });

    if (!guestRes.ok) {
      return res.status(502).json({ success: false, message: 'Failed to fetch Superset guest token' });
    }

    const { token } = await guestRes.json();
    return res.json({ success: true, token });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
