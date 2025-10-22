// Import Library dan Inisialisasi Express
import express from "express";
const app = express();
const PORT = 3000;

// Middleware agar bisa baca JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route sederhana
app.get("/", (req, res) => {
  res.json({ message: "Server berjalan dengan Express JS 🚀" });
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});

import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "mahasiswa_db",
});

app.listen(PORT, async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log("✅ Terhubung ke database MySQL");
  } catch (err) {
    console.error("❌ Gagal konek ke database:", err.message);
  }
  console.log(`Server berjalan di http://localhost:${PORT}`);
});

// GET semua data
app.get("/biodata.json", async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM biodata ORDER BY id ASC");
  res.json({ status: "success", total: rows.length, data: rows });
});

// GET berdasarkan ID
app.get("/biodata/:id.json", async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query("SELECT * FROM biodata WHERE id = ?", [id]);
  if (!rows.length)
    return res.status(404).json({ status: "error", message: "Data tidak ditemukan" });
  res.json({ status: "success", data: rows[0] });
});


// POST data baru
app.post("/biodata", async (req, res) => {
  const { nama, nim, kelas } = req.body;
  if (!nama || !nim || !kelas)
    return res.status(400).json({ status: "error", message: "Field wajib diisi" });

  const [exist] = await pool.query("SELECT id FROM biodata WHERE nim = ?", [nim]);
  if (exist.length)
    return res.status(409).json({ status: "error", message: "NIM sudah terdaftar" });

  const [result] = await pool.query(
    "INSERT INTO biodata (nama, nim, kelas) VALUES (?, ?, ?)",
    [nama, nim, kelas]
  );
  res.status(201).json({
    status: "success",
    message: "✅ Data berhasil ditambahkan",
    data: { id: result.insertId, nama, nim, kelas },
  });
});

// PUT (Update data)
app.put("/biodata/:id", async (req, res) => {
  const { id } = req.params;
  const { nama, nim, kelas } = req.body;
  const [result] = await pool.query(
    "UPDATE biodata SET nama = ?, nim = ?, kelas = ? WHERE id = ?",
    [nama, nim, kelas, id]
  );
  if (result.affectedRows === 0)
    return res.status(404).json({ status: "error", message: "Data tidak ditemukan" });
  res.json({ status: "success", message: "✅ Data berhasil diperbarui" });
});

// DELETE (Hapus data)
app.delete("/biodata/:id", async (req, res) => {
  const { id } = req.params;
  const [result] = await pool.query("DELETE FROM biodata WHERE id = ?", [id]);
  if (result.affectedRows === 0)
    return res.status(404).json({ status: "error", message: "Data tidak ditemukan" });
  res.json({ status: "success", message: "✅ Data berhasil dihapus" });
});

