const mysql = require("mysql");
const bcrypt = require("bcrypt");

const db = mysql.createConnection({
  host: "localhost",
  database: "auth",
  user: "root",
  password: "nopassword"
});

db.connect((err) => {
  if (err) throw err;
  console.log("Database connected");

  // Query untuk mendapatkan semua pengguna
  db.query('SELECT * FROM userweb', (err, userweb) => {
    if (err) throw err;

    userweb.forEach(user => {
      // Cek apakah password sudah di-hash (panjang hash bcrypt adalah 60 karakter)
      if (user.password.length !== 60) {
        // Hash password dan update di database
        bcrypt.hash(user.password, 10, (err, hash) => {
          if (err) throw err;

          db.query('UPDATE userweb SET password = ? WHERE id = ?', [hash, user.id], (err, result) => {
            if (err) throw err;
            console.log(`Password for user ${user.email} has been updated.`);
          });
        });
      }
    });
  });

  // Close the connection after all updates
  db.end((err) => {
    if (err) throw err;
    console.log('Database connection closed.');
  });
});
