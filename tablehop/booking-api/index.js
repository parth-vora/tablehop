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

// helper functions 

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

// restaurant data 

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

app.get('/restaurants/:id/availability', async (req, res) => {
    try {
        const restaurant = await getRestaurant(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        const date = req.query.date;
        const party = Number(req.query.party || 2);
        const group = req.query.group || 'bookings';

        const bookings = (await findBooking(group, restaurant.id, date));

        const slots = (restaurant.timeSlots || []).map((time) => {
            const takenTables = bookings
                .filter(b => b.time === time)
                .map(b => b.tableId);
                
            const freeTables = (restaurant.tables || []).filter(
                t => t.size >= party && !takenTables.includes(t.id)
            );
            
            return { time, free: freeTables.length };
        });

        res.json({ restaurant, slots });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// bookings 

app.post('/bookings', async (req, res) => {
    try {
        const { group = 'bookings', restaurantId, tableId, date, time, guests, dinerName } = req.body;

        if (!restaurantId || !tableId || !date || !time || !guests || !dinerName) {
            return res.status(400).json({ error: 'Missing required booking fields' });
        }

        const restaurant = await getRestaurant(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        const uniqueBooking = bookingExists(restaurantId, tableId, date, time);

        const existingBookings = await findBooking(group, restaurantId, date);
        const isTaken = existingBookings.some(b => b.bookingKey === uniqueBooking);

        if (isTaken) {
            return res.status(409).json({ error: 'This table is already booked for this time slot.' });
        }

        const bookingData = {
            restaurantId,
            tableId,
            date,
            time,
            guests: Number(guests),
            dinerName: getDiner(dinerName),
            bookingKey: uniqueBooking,
            createdAt: new Date().toISOString()
        };

        const docRef = await store.collection(group).add(bookingData);

        res.status(201).json({
            message: 'Booking confirmed!',
            bookingId: docRef.id,
            ...bookingData
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// server 
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Local server running at http://localhost:${PORT}`);
    });
}
export default app;