// ===== Import Library =====
import express from "express";
import mysql from "mysql2/promise";

// ===== Inisialisasi Express =====
const app = express();
const PORT = Number(process.env.PORT || 3000);

// 👉 Middleware agar bisa baca body JSON & form
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Koneksi DB =====
const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "mahasiswa_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ===== Util: HTML Layout + Style (satu kali) =====
const STYLE = `
:root{ --bg:#0f172a; --text:#e5e7eb; --muted:#94a3b8; --card:#111827; --card2:#0b1220; --primary:#22d3ee; --accent:#a78bfa; --ok:#10b981; --border:#1f2937; }
*{box-sizing:border-box}
body{ margin:0; background: radial-gradient(1200px 600px at 10% 0%, rgba(167,139,250,.15), transparent 40%),
                   radial-gradient(1200px 600px at 90% 100%, rgba(34,211,238,.15), transparent 40%), var(--bg);
      color:var(--text); font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
      min-height:100dvh; display:grid; place-items:center; padding:24px; }
.container{ width:min(100%, 980px); }
.card{ background: linear-gradient(180deg, var(--card), var(--card2)); border:1px solid var(--border); border-radius:18px; padding:22px;
       box-shadow: 0 12px 40px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.03); }
.header{ display:flex; gap:16px; align-items:center; justify-content:space-between; margin-bottom:16px; }
.title{ font-size:20px; font-weight:700; letter-spacing:.2px; }
.badge{ padding:4px 10px; border-radius:999px; background:rgba(34,211,238,.12); color:var(--primary); border:1px solid rgba(34,211,238,.35); font-size:12px; font-weight:600; }
.tools{ display:flex; gap:10px; align-items:center; }
.search{ width:260px; background:#0a0f1c; color:var(--text); border:1px solid var(--border); padding:10px 12px; border-radius:12px; outline:none; }
table{ width:100%; border-collapse:collapse; overflow:hidden; border-radius:12px; }
thead th{ text-align:left; font-size:12px; color:var(--muted); font-weight:700; padding:12px 14px; background:#0b1323; border-bottom:1px solid var(--border); }
tbody td{ padding:14px; border-bottom:1px solid var(--border); font-size:14px; }
tbody tr:hover{ background:rgba(167,139,250,.06); transition:.2s }
.foot{ display:flex; justify-content:space-between; align-items:center; margin-top:12px; color:var(--muted); font-size:12px; }
.pill{ padding:6px 10px; border:1px solid var(--border); border-radius:999px; cursor:pointer; user-select:none; }
.pill:hover{ border-color:#334155 } .ok{ color:var(--ok) } .muted{ color:var(--muted) } a{ color:var(--primary); text-decoration:none }
.kv{ display:grid; grid-template-columns:160px 1fr; gap:8px 14px; margin-top:8px; }
.kv .k{ color:var(--muted); }
.kv .v{ font-weight:600; }
`;

const layout = (title, bodyHTML, rightTool = "") => `<!doctype html>
<html lang="id"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title}</title>
<style>${STYLE}</style>
</head><body>
<div class="container">
  <div class="card">
    <div class="header">
      <div class="title">${title}</div>
      <div class="tools">${rightTool}</div>
    </div>
    ${bodyHTML}
  </div>
</div>
</body></html>`;

// ===== Root (info) =====
app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    message: "🚀 API Mahasiswa berjalan!",
    endpoints: {
      list_html: "/biodata",
      list_json: "/biodata.json",
      detail_html: "/biodata/:id",
      detail_json: "/biodata/:id.json",
      create: "POST /biodata",
      update: "PUT /biodata/:id",
      delete: "DELETE /biodata/:id",
    },
  });
});

/* ---------------- JSON endpoints ---------------- */
// taruh .json SEBELUM :id agar tidak bentrok
app.get("/biodata.json", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM biodata ORDER BY id ASC");
    res.json({ status: "success", total: rows.length, data: rows });
  } catch (e) {
    res.status(500).json({ status: "error", message: "Gagal mengambil data" });
  }
});

app.get("/biodata/:id.json", async (req, res) => {
  const { id } = req.params;
  if (!/^\d+$/.test(id)) return res.status(400).json({ status: "error", message: "ID harus angka" });
  try {
    const [rows] = await pool.query("SELECT * FROM biodata WHERE id = ?", [Number(id)]);
    if (!rows.length) return res.status(404).json({ status: "error", message: "Data tidak ditemukan" });
    res.json({ status: "success", data: rows[0] });
  } catch (e) {
    res.status(500).json({ status: "error", message: "Gagal mengambil data" });
  }
});

/* ---------------- HTML endpoints (desain box) --------------- */
// LIST (HTML)
app.get("/biodata", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM biodata ORDER BY id ASC");

    const rightTool = `
      <input id="q" class="search" placeholder="Cari nama / NIM / kelas…" />
      <a class="pill" href="/biodata.json">JSON</a>`;

    const table = `
      <table>
        <thead><tr><th style="width:76px">ID</th><th>Nama</th><th>NIM</th><th>Kelas</th></tr></thead>
        <tbody id="rows">
          ${rows.map(d => `
            <tr>
              <td>#${d.id}</td>
              <td><a href="/biodata/${d.id}">${d.nama}</a></td>
              <td><strong>${d.nim}</strong></td>
              <td>${d.kelas}</td>
            </tr>`).join("")}
        </tbody>
      </table>
      <div class="foot">
        <div><span class="ok">●</span> <span class="muted"><span id="meta">Semua data</span></span></div>
        <div class="muted">Total: <span id="total">${rows.length}</span> data</div>
      </div>

      <script>
        (function(){
          const cache = ${JSON.stringify(rows)};
          const rowsEl = document.getElementById('rows');
          const totalEl = document.getElementById('total');
          const metaEl  = document.getElementById('meta');
          const qEl     = document.getElementById('q');

          function render(data){
            rowsEl.innerHTML = data.map(d => \`
              <tr>
                <td>#\${d.id}</td>
                <td><a href="/biodata/\${d.id}">\${d.nama}</a></td>
                <td><strong>\${d.nim}</strong></td>
                <td>\${d.kelas}</td>
              </tr>\`).join('');
            totalEl.textContent = data.length;
          }

          qEl.addEventListener('input', (e)=>{
            const q = e.target.value.toLowerCase().trim();
            const filtered = cache.filter(d =>
              String(d.nama).toLowerCase().includes(q) ||
              String(d.nim).toLowerCase().includes(q)  ||
              String(d.kelas).toLowerCase().includes(q)
            );
            render(filtered);
            metaEl.textContent = q ? ('Filter: "' + q + '" ('+ filtered.length +' cocok)') : 'Semua data';
          });
        })();
      </script>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(layout("📚 Biodata Mahasiswa", table, rightTool));
  } catch (e) {
    res.status(500).send(layout("Error", `<p class="muted">Gagal mengambil data.</p>`));
  }
});

/* ---------------- CREATE (POST) ---------------- */
// Body JSON: { "nama": "Rudi", "nim": "20220140050", "kelas": "B" }
app.post("/biodata", async (req, res) => {
  const { nama, nim, kelas } = req.body;

  if (!nama || !nim || !kelas) {
    return res.status(400).json({
      status: "error",
      message: "Semua field (nama, nim, kelas) wajib diisi",
    });
  }

  try {
    // cek NIM duplikat
    const [exist] = await pool.query("SELECT id FROM biodata WHERE nim = ?", [nim]);
    if (exist.length) {
      return res.status(409).json({ status: "error", message: "NIM sudah terdaftar" });
    }

    const [result] = await pool.query(
      "INSERT INTO biodata (nama, nim, kelas) VALUES (?, ?, ?)",
      [nama, nim, kelas]
    );

    return res.status(201).json({
      status: "success",
      message: "✅ Data berhasil ditambahkan",
      data: { id: result.insertId, nama, nim, kelas },
    });
  } catch (error) {
    console.error("❌ Gagal tambah data:", error.message);
    return res.status(500).json({ status: "error", message: "Gagal menambahkan data ke database" });
  }
});

/* ---------------- UPDATE (PUT) ---------------- */
// PUT /biodata/:id  Body: { nama, nim, kelas }
app.put("/biodata/:id", async (req, res) => {
  const { id } = req.params;
  const { nama, nim, kelas } = req.body;

  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ status: "error", message: "ID harus angka" });
  }
  if (!nama || !nim || !kelas) {
    return res.status(400).json({ status: "error", message: "Semua field (nama, nim, kelas) wajib diisi" });
  }

  try {
    // tolak NIM duplikat selain milik diri sendiri
    const [sameNim] = await pool.query(
      "SELECT id FROM biodata WHERE nim = ? AND id <> ?",
      [nim, id]
    );
    if (sameNim.length) {
      return res.status(409).json({ status: "error", message: "NIM sudah terpakai" });
    }

    const [result] = await pool.query(
      "UPDATE biodata SET nama = ?, nim = ?, kelas = ? WHERE id = ?",
      [nama, nim, kelas, Number(id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Data tidak ditemukan" });
    }

    const [rows] = await pool.query("SELECT * FROM biodata WHERE id = ?", [Number(id)]);
    return res.json({ status: "success", message: "✅ Data diperbarui", data: rows[0] });
  } catch (e) {
    console.error("❌ Gagal update:", e.message);
    return res.status(500).json({ status: "error", message: "Gagal memperbarui data" });
  }
});

/* ---------------- DELETE (DELETE) ---------------- */
// DELETE /biodata/:id
app.delete("/biodata/:id", async (req, res) => {
  const { id } = req.params;

  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ status: "error", message: "ID harus angka" });
  }

  try {
    const [result] = await pool.query("DELETE FROM biodata WHERE id = ?", [Number(id)]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Data tidak ditemukan" });
    }
    return res.json({ status: "success", message: "✅ Data dihapus" });
  } catch (e) {
    console.error("❌ Gagal hapus:", e.message);
    return res.status(500).json({ status: "error", message: "Gagal menghapus data" });
  }
});

/* ---------------- Not Found & Error Handler ---------------- */
app.use((req, res) => {
  if (req.accepts("html")) {
    return res.status(404).send(layout("404", `<p class="muted">Endpoint tidak ditemukan.</p>`));
  }
  return res.status(404).json({ status: "error", message: "Endpoint tidak ditemukan" });
});

// ===== Start Server =====
app.listen(PORT, async () => {
  try {
    const c = await pool.getConnection();
    await c.ping(); c.release();
    console.log("✅ Terhubung ke database MySQL");
  } catch (err) {
    console.error("❌ Gagal terhubung ke database:", err.message);
  }
  console.log(`🚀 Server berjalan di: http://localhost:${PORT}`);
});
      