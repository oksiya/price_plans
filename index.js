import express from 'express';
import * as sqlite from 'sqlite';
import sqlite3 from 'sqlite3';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4011;

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(cors()); 

// SQLite setup
const db = await sqlite.open({
    filename: './data_plan.db',
    driver: sqlite3.Database
});

// Run migrations
await db.migrate();

// API Endpoints

// 1. Calculate phone bill total
app.post('/api/phonebill', async (req, res) => {
    const { price_plan, actions } = req.body;
    const plan = await db.get('select * from price_plan where plan_name = ?', price_plan);
    
    if (!plan) {
        return res.status(404).send({ error: 'Price plan not found' });
    }

    const total = actions.split(', ').reduce((sum, action) => {
        if (action === 'sms') {
            return sum + plan.sms_price;
        } else if (action === 'call') {
            return sum + plan.call_price;
        }
        return sum;
    }, 0);

    res.send({ total: total.toFixed(2) });
});

// 2. Get all price plans
app.get('/api/price_plans', async (req, res) => {
    const plans = await db.all('select * from price_plan');
    res.send(plans);
});

// 3. Create a new price plan
app.post('/api/price_plan/create', async (req, res) => {
    const { name, call_cost, sms_cost } = req.body;
    await db.run('insert into price_plan (plan_name, sms_price, call_price) values (?, ?, ?)', [name, sms_cost, call_cost]);
    res.send({ success: 'Price plan created' });
});

// 4. Update a price plan
app.post('/api/price_plan/update', async (req, res) => {
    const { name, call_cost, sms_cost } = req.body;
    await db.run('update price_plan set sms_price = ?, call_price = ? where plan_name = ?', [sms_cost, call_cost, name]);
    res.send({ success: 'Price plan updated' });
});

// 5. Delete a price plan
app.post('/api/price_plan/delete', async (req, res) => {
    const { id } = req.body;
    await db.run('delete from price_plan where id = ?', id);
    res.send({ success: 'Price plan deleted' });
});

app.listen(PORT, () => {
    console.log(`Server started on ${PORT}`);
});
