const express = require("express");
const jwt = require("jsonwebtoken");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/login", (req, res) => {
  const password = String(req.body?.password || "");
  const expected = String(process.env.AUTH_PASSWORD || "");

  if (!expected || password !== expected) {
    return res.status(401).json({ error: "Mot de passe incorrect" });
  }

  const token = jwt.sign({ sub: "bezeid" }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ ok: true });
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", { sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  res.json({ message: "Déconnecté" });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ authenticated: true });
});

module.exports = router;
