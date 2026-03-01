const jwt = require("jsonwebtoken");

const ADMIN = {
  username: "admin",
  password: "1234",
};

exports.login = function (req, res) {
  const { username, password } = req.body;

  if (
    username !== ADMIN.username ||
    password !== ADMIN.password
  ) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { username: "admin", role: "admin" },
    "secretkey",
    { expiresIn: "1h" }
  );

  res.json({ token });
};