const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, mailingAddress, flatId } = req.body;
    const user = await authService.register(
      { name, email, password, role, phone, mailingAddress, flatId },
      req.ip
    );
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await authService.login({ email, password }, req.ip);
    res.json({ accessToken, refreshToken, user });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }
    const tokens = await authService.refreshTokens(refreshToken);
    res.json(tokens);
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user._id);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

const me = (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, refresh, logout, me };
