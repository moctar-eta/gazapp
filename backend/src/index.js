const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
require('dotenv').config();


const app = express();

app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'https://gazapp.vercel.app'
    ],
    credentials: true
}));

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'API Bezeid opérationnelle sur Supabase !' });
});

// ==========================================
// ROUTES AUTHENTIFICATION
// ==========================================

app.post('/api/auth/login', async (req, res) => {
    const { password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM merchant_settings WHERE id = 1');
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        const merchant = result.rows[0];
        const isMatch = await bcrypt.compare(password, merchant.password);

        if (!isMatch) {
            return res.status(400).json({ error: 'Mot de passe incorrect' });
        }

        const token = jwt.sign({ id: merchant.id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1d' });
        res.json({ token, message: 'Connexion réussie' });

    } catch (err) {
        console.error('Erreur SQL lors du login :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.get('/api/auth/me', async (req, res) => {
    try {
        res.json({ authenticated: true });
    } catch (err) {
        res.status(401).json({ error: 'Non autorisé' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.json({ message: 'Déconnexion réussie' });
});

// ==========================================
// ROUTES PARAMÈTRES / SETTINGS
// ==========================================

const getSettingsHandler = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM merchant_settings WHERE id = 1');
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Paramètres non trouvés' });
        }
        const merchant = result.rows[0];

        const prices = merchant.prices || {
            b3: merchant.price_b3 || 0,
            b6: merchant.price_b6 || 0,
            b12: merchant.price_b12 || 0,
        };

        res.json({
            ...merchant,
            prices,
            price_b3: Number(prices.b3 || merchant.price_b3 || 0),
            price_b6: Number(prices.b6 || merchant.price_b6 || 0),
            price_b12: Number(prices.b12 || merchant.price_b12 || 0),
        });
    } catch (err) {
        console.error('Erreur récuperation settings :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

app.get('/api/settings', getSettingsHandler);
app.get('/api/merchant/settings', getSettingsHandler);

const updateSettingsHandler = async (req, res) => {
    console.log("--> Enregistrement en base de données :", req.body);
    const { phone, price_b3, price_b6, price_b12, prices, newPassword } = req.body;

    try {
        const check = await pool.query('SELECT * FROM merchant_settings WHERE id = 1');
        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Marchand introuvable' });
        }

        const current = check.rows[0];
        let queryParts = [];
        let params = [];
        let paramIndex = 1;

        if ('phone' in current && phone !== undefined) {
            queryParts.push(`phone = $${paramIndex++}`);
            params.push(phone);
        }

        if ('price_b3' in current && price_b3 !== undefined) {
            queryParts.push(`price_b3 = $${paramIndex++}`);
            params.push(price_b3);
        }
        if ('price_b6' in current && price_b6 !== undefined) {
            queryParts.push(`price_b6 = $${paramIndex++}`);
            params.push(price_b6);
        }
        if ('price_b12' in current && price_b12 !== undefined) {
            queryParts.push(`price_b12 = $${paramIndex++}`);
            params.push(price_b12);
        }

        if ('prices' in current) {
            const updatedPrices = prices || {
                b3: price_b3 !== undefined ? price_b3 : (current.prices?.b3 || 0),
                b6: price_b6 !== undefined ? price_b6 : (current.prices?.b6 || 0),
                b12: price_b12 !== undefined ? price_b12 : (current.prices?.b12 || 0),
            };
            queryParts.push(`prices = $${paramIndex++}`);
            params.push(JSON.stringify(updatedPrices));
        }

        if (newPassword && newPassword.trim() !== '') {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            queryParts.push(`password = $${paramIndex++}`);
            params.push(hashedPassword);
        }

        if (queryParts.length === 0) {
            return res.json({ message: 'Aucun changement nécessaire', settings: current });
        }

        const query = `UPDATE merchant_settings SET ${queryParts.join(', ')} WHERE id = 1 RETURNING *`;
        const result = await pool.query(query, params);

        console.log("--> Modifications sauvegardées dans Supabase !");
        res.json({ message: 'تم حفظ الإعدادات بنجاح', settings: result.rows[0] });

    } catch (err) {
        console.error('Erreur SQL lors de la sauvegarde :', err);
        res.status(500).json({ error: 'Erreur serveur lors de la sauvegarde' });
    }
};

app.put('/api/settings', updateSettingsHandler);
app.post('/api/settings', updateSettingsHandler);
app.put('/api/merchant/settings', updateSettingsHandler);
app.post('/api/merchant/settings', updateSettingsHandler);

// ==========================================
// ROUTES VENTES / SALES
// ==========================================

const createSaleHandler = async (req, res) => {
    console.log("--> Nouvelle vente reçue :", req.body);
    const { quantities, prices, totalAmount, paymentStatus, customerName } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO sales (quantities, prices, total_amount, payment_status, customer_name)
VALUES ($1, $2, $3, $4, $5)
RETURNING *`,
            [
                JSON.stringify(quantities),
                JSON.stringify(prices),
                totalAmount,
                paymentStatus || "paid",
                customerName || "",
            ]
        );

        console.log("--> Vente enregistrée dans Supabase !");
        res.json({ message: "تم حفظ المبيعات بنجاح", sale: result.rows[0] });
    } catch (err) {
        console.error("Erreur SQL lors de l'enregistrement de la vente :", err);
        res.status(500).json({ error: "Erreur serveur lors de l'enregistrement" });
    }
};

app.post('/api/sales', createSaleHandler);
const getSalesHandler = async (req, res) => {
    try {
        const search = req.query.search || "";
        const status = req.query.status || "";

        let query = "SELECT * FROM sales";
        let conditions = [];
        let params = [];

        if (search) {
            params.push(`%${search}%`);
            conditions.push(`customer_name ILIKE $${params.length}`);
        }

        if (status) {
            params.push(status);
            conditions.push(`payment_status = $${params.length}`);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY created_at DESC";

        const result = await pool.query(query, params);

        const sales = result.rows.map((r) => ({
            ...r,
            totalAmount: r.total_amount,
            paymentStatus: r.payment_status,
            customerName: r.customer_name,
            createdAt: r.created_at,
        }));

        res.json(sales);
    } catch (err) {
        console.error("Erreur récupération ventes :", err);
        res.status(500).json({ error: "Erreur serveur lors de la récupération" });
    }
};
app.get('/api/sales', getSalesHandler);

const deleteSaleHandler = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM sales WHERE id = $1", [id]);
        res.json({ message: "Vente supprimée" });
    } catch (err) {
        console.error("Erreur suppression vente :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

app.delete('/api/sales/:id', deleteSaleHandler);
// ==========================================
// ROUTES RÉDUCTIONS / DISCOUNTS
// ==========================================

const getDiscountPrices = async (req, res) => {
    try {
        const r = await pool.query("SELECT discount_prices FROM merchant_settings WHERE id = 1");
        const p = r.rows[0]?.discount_prices || {};
        const b3 = Number(p.b3 ?? p.B3) || 0;
        const b6 = Number(p.b6 ?? p.B6) || 0;
        const b12 = Number(p.b12 ?? p.B12) || 0;
        res.json({ b3, b6, b12, B3: b3, B6: b6, B12: b12 });
    } catch (err) {
        console.error("Erreur prix réduction :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

const saveDiscountPrices = async (req, res) => {
    try {
        const p = req.body.prices || req.body;
        const clean = {
            b3: Number(p.B3 ?? p.b3) || 0,
            b6: Number(p.B6 ?? p.b6) || 0,
            b12: Number(p.B12 ?? p.b12) || 0,
        };
        await pool.query(
            "UPDATE merchant_settings SET discount_prices = $1 WHERE id = 1",
            [JSON.stringify(clean)]
        );
        res.json({ ...clean, B3: clean.b3, B6: clean.b6, B12: clean.b12 });
    } catch (err) {
        console.error("Erreur sauvegarde prix réduction :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

app.get('/api/discounts/prices', getDiscountPrices);
app.put('/api/discounts/prices', saveDiscountPrices);
app.post('/api/discounts/prices', saveDiscountPrices);

app.get('/api/discounts', async (req, res) => {
    try {
        const r = await pool.query("SELECT * FROM discounts ORDER BY created_at DESC");
        res.json(r.rows.map((d) => {
            const q = d.quantities || {};
            const b3 = Number(q.b3 ?? q.B3) || 0;
            const b6 = Number(q.b6 ?? q.B6) || 0;
            const b12 = Number(q.b12 ?? q.B12) || 0;
            return {
                id: d.id,
                buyerName: d.customer_name,
                customerName: d.customer_name,
                createdAt: d.created_at,
                total: Number(d.total_amount),
                totalAmount: Number(d.total_amount),
                quantities: { b3, b6, b12, B3: b3, B6: b6, B12: b12 },
                items: [
                    { id: `${d.id}-B3`, bottleType: "B3", quantity: b3 },
                    { id: `${d.id}-B6`, bottleType: "B6", quantity: b6 },
                    { id: `${d.id}-B12`, bottleType: "B12", quantity: b12 },
                ].filter((it) => it.quantity > 0),
            };
        }));
    } catch (err) {
        console.error("Erreur liste réductions :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

app.post('/api/discounts', async (req, res) => {
    console.log("--> Réduction reçue :", req.body);
    const { buyerName, quantities } = req.body;
    try {
        const pr = await pool.query("SELECT discount_prices FROM merchant_settings WHERE id = 1");
        const dp = pr.rows[0]?.discount_prices || { b3: 0, b6: 0, b12: 0 };
        const q = {
            b3: Number(quantities?.B3 ?? quantities?.b3) || 0,
            b6: Number(quantities?.B6 ?? quantities?.b6) || 0,
            b12: Number(quantities?.B12 ?? quantities?.b12) || 0,
        };
        const total = q.b3 * Number(dp.b3) + q.b6 * Number(dp.b6) + q.b12 * Number(dp.b12);
        const r = await pool.query(
            `INSERT INTO discounts (customer_name, quantities, prices, total_amount)
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [buyerName || "", JSON.stringify(q), JSON.stringify(dp), total]
        );
        res.json(r.rows[0]);
    } catch (err) {
        console.error("Erreur enregistrement réduction :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

app.post('/api/discounts', async (req, res) => {
    console.log("--> Réduction reçue :", req.body);
    const { buyerName, customerName, quantities } = req.body;

    try {
        // Prix de réduction enregistrés
        const pr = await pool.query("SELECT discount_prices FROM merchant_settings WHERE id = 1");
        const dp = pr.rows[0]?.discount_prices || { b3: 0, b6: 0, b12: 0 };

        // Normaliser les quantités en minuscules
        const q = {
            b3: Number(quantities?.B3 ?? quantities?.b3) || 0,
            b6: Number(quantities?.B6 ?? quantities?.b6) || 0,
            b12: Number(quantities?.B12 ?? quantities?.b12) || 0,
        };

        const total = q.b3 * Number(dp.b3) + q.b6 * Number(dp.b6) + q.b12 * Number(dp.b12);

        const r = await pool.query(
            `INSERT INTO discounts (customer_name, quantities, prices, total_amount)
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [buyerName || customerName || "", JSON.stringify(q), JSON.stringify(dp), total]
        );
        res.json(r.rows[0]);
    } catch (err) {
        console.error("Erreur enregistrement réduction :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

app.delete('/api/discounts/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM discounts WHERE id = $1", [req.params.id]);
        res.json({ message: "Supprimé" });
    } catch (err) {
        console.error("Erreur suppression réduction :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});