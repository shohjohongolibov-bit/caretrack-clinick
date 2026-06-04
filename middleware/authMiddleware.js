const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const secretKey = 'caretrack-secret-key';
const dataPath = file => path.join(__dirname, '..', 'data', file);

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token topilmadi yoki noto‘g‘ri format' });
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token amal qilmaydi yoki muddati tugagan' });
    }
    req.user = decoded;
    next();
  });
};

exports.authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Sizda kerakli huquq yo‘q' });
  }
  next();
};

exports.getCurrentUser = () => {
  const users = JSON.parse(fs.readFileSync(dataPath('users.json')));
  return users;
};
