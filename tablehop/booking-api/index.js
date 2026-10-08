import express from 'express';
import { Firestore } from '@google-cloud/firestore';
import * as samples from './samples.js';

const store = new Firestore();
const app = express();
app.use(express.json());

app.use((req, res, next) => {
    if (process.env.API_KEY && req.get('x-api-key') !== process.env.API_KEY) {
        return res.status(401).send('Unauthorized');
    }
    next();
});

async function allRestaurants() {
    const bookingsRef = await store.collection('restaurants').get();
    return bookingsRef.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function findBooking(group, restaurantId, date) {
    const bookingsRef = await store.collectionGroup(group)
        .where('restaurantId', '==', restaurantId)
        .where('date', '==', date)
        .get();
    return bookingsRef.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function getRestaurant(id) {
    const restaurantRef = await store.collection('restaurants').doc(id).get();
    if (!restaurantRef.exists) return null;
    return { id: restaurantRef.id, ...restaurantRef.data() };
}  

function getDiner(name) {
    return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

function bookingExists(restaurantId, tableId, date, time) {
    return `${restaurantId}_${tableId}_${date}_${time}`;
}

app.get('/restaurants', async (req, res) => {
    try {
        const data = await allRestaurants();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/restaurants/:id', async (req, res) => {
    try {
        const restaurant = await getRestaurant(req.params.id);
        if (!restaurant) {
            return res.status(404).send('Restaurant not found');
        }

        const date = req.query.date;
        const time = req.query.time;
        const guests = Number(req.query.guests || 2);

        const bookings = (await findBooking(req.query.group, req.params.id, date))
            .filter(b => b.guests >= guests);

        const availableTables = (restaurant.tables || []).filter(table => {
            const bookingKey = bookingExists(req.params.id, table.id, date, time);
            return !bookings.some(b => b.bookingKey === bookingKey);
        });

        res.json({
            ...restaurant,
            availableTables
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Local server running at http://localhost:${PORT}`);
    });
}
export default app;