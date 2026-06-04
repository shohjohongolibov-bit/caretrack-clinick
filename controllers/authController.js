const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const secretKey = 'caretrack-secret-key';
const dataPath = file => path.join(__dirname, '..', 'data', file);

exports.login = (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Foydalanuvchi nomi va parol kiritilishi kerak' });
    }

    const users = JSON.parse(fs.readFileSync(dataPath('users.json')));
    const user = users.find(item => item.username === username && item.password === password);

    if (!user) {
      return res.status(401).json({ error: 'Login yoki parol noto‘g‘ri' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, secretKey, {
      expiresIn: '8h',
    });

    res.json({ token, role: user.role, name: user.name });
  } catch (error) {
    next(error);
  }
};

exports.me = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token topilmadi' });
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, secretKey);
    res.json(payload);
  } catch (error) {
    next(error);
  }
};
