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
