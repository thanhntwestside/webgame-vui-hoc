const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path"); // Thêm thư viện path

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// LỆNH MỚI: Phân phát giao diện Web từ thư mục public
app.use(express.static(path.join(__dirname, "public")));

const db = new sqlite3.Database("./gameDB.sqlite");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    name TEXT PRIMARY KEY, age TEXT, gender TEXT, avatar TEXT,
    lastSubject TEXT, progress TEXT, arena TEXT
  )`);
});

app.get("/api/users", (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    let usersDB = {};
    rows.forEach((row) => {
      usersDB[row.name] = {
        name: row.name,
        age: row.age,
        gender: row.gender,
        avatar: row.avatar,
        lastSubject: row.lastSubject,
        progress: JSON.parse(row.progress),
        arena: row.arena ? JSON.parse(row.arena) : {},
      };
    });
    res.json(usersDB);
  });
});

app.post("/api/users", (req, res) => {
  const { name, age, gender, avatar, lastSubject, progress, arena } = req.body;
  const sql = `INSERT INTO users (name, age, gender, avatar, lastSubject, progress, arena)
               VALUES (?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(name) DO UPDATE SET
               age=excluded.age, gender=excluded.gender, avatar=excluded.avatar,
               lastSubject=excluded.lastSubject, progress=excluded.progress, arena=excluded.arena`;
  db.run(
    sql,
    [
      name,
      age,
      gender,
      avatar,
      lastSubject,
      JSON.stringify(progress),
      JSON.stringify(arena || {}),
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    },
  );
});

app.delete("/api/users/:name", (req, res) => {
  db.run("DELETE FROM users WHERE name = ?", req.params.name, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// LỆNH MỚI: Đổi Port 3000 thành Port động của Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Máy chủ đang chạy tại Port: ${PORT}`));
