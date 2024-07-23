const mysql = require("mysql");
const bcrypt = require("bcrypt");

const db = mysql.createConnection({
  host: "localhost",
  database: "auth",
  user: "root",
  password: ""
});

db.connect((err) => {
  if (err) throw err;
  console.log("Database connected");

  // Query untuk mendapatkan semua pengguna
  db.query('SELECT * FROM users', (err, users) => {
    if (err) throw err;

    users.forEach(user => {
      // Cek apakah password sudah di-hash (panjang hash bcrypt adalah 60 karakter)
      if (user.password.length !== 60) {
        // Hash password dan update di database
        bcrypt.hash(user.password, 10, (err, hash) => {
          if (err) throw err;

          db.query('UPDATE users SET password = ? WHERE id = ?', [hash, user.id], (err, result) => {
            if (err) throw err;
            console.log(`Password for user ${user.username} has been updated.`);
          });
        });
      }
    });
  });
});
