require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth");
const salesRoutes = require("./routes/sales");
const invoicesRoutes = require("./routes/invoices");
const settingsRoutes = require("./routes/settings");
const discountsRoutes = require("./routes/discounts");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/sales", invoicesRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/discounts", discountsRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erreur serveur" });
});

module.exports = app;
