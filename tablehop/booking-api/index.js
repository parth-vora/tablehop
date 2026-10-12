import express from 'express';
import { Firestore } from '@google-cloud/firestore';
import * as samples from './samples.js';

const store = new Firestore();
const app = express();
app.use(express.json());

app.use((req, res, next) => {
    if (!process.env.API_KEY || req.get('x-api-key') !== process.env.API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
});

// helper functions

async function allRestaurants() {
    const restaurantsRef = await store.collection('restaurants').get();
    return restaurantsRef.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function findBy(collection, field, value) {
    const docsRef = await store.collection(collection).where(field, '==', value).get();
    return docsRef.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function findBooking(collection, restaurantId, date) {
    return (await findBy(collection, 'restaurantId', restaurantId)).filter(b => b.date === date);
}

async function getRestaurant(id) {
    const restaurantRef = await store.collection('restaurants').doc(id).get();
    if (!restaurantRef.exists) return null;
    return { id: restaurantRef.id, ...restaurantRef.data() };
}

function getDiner(name) {
    return name.trim().toLowerCase().replace(/\s+/g, '-');
}

function bookingExists(restaurantId, tableId, date, time) {
    return `${restaurantId}_${tableId}_${date}_${time}`;
}

async function clear(collection) {
    const docsRef = await store.collection(collection).get();
    await Promise.all(docsRef.docs.map(doc => doc.ref.delete()));
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
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        const date = req.query.date;
        const time = req.query.time;
        const guests = Number(req.query.guests || 2);

        const takenTables = (await findBooking('bookings', restaurant.id, date))
            .filter(b => b.time === time)
            .map(b => b.tableId);

        const availableTables = restaurant.tables
            .filter(t => t.size >= guests && !takenTables.includes(t.id));

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
        const guests = Number(req.query.guests || 2);

        const bookings = await findBooking('bookings', restaurant.id, date);

        const slots = restaurant.timeSlots.map((time) => {
            const takenTables = bookings
                .filter(b => b.time === time)
                .map(b => b.tableId);

            const freeTables = restaurant.tables.filter(
                t => t.size >= guests && !takenTables.includes(t.id)
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
        const { restaurantId, tableId, date, time, guests, dinerName } = req.body;

        if (!restaurantId || !date || !time || !guests || !dinerName) {
            return res.status(400).json({ error: 'Missing required booking fields' });
        }

        const restaurant = await getRestaurant(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        const dinerId = getDiner(dinerName);
        const options = tableId
            ? restaurant.tables.filter(t => t.id === tableId)
            : restaurant.tables.filter(t => t.size >= Number(guests)).sort((a, b) => a.size - b.size);

        const result = await store.runTransaction(async (tx) => {
            const mine = await tx.get(store.collection('bookings').where('dinerId', '==', dinerId));
            const already = mine.docs.map(doc => doc.data())
                .find(b => b.restaurantId === restaurantId && b.date === date && b.time === time);
            if (already) {
                return { status: 200, body: already };
            }

            for (const table of options) {
                const bookingId = bookingExists(restaurantId, table.id, date, time);
                const bookingRef = store.collection('bookings').doc(bookingId);

                if ((await tx.get(bookingRef)).exists) {
                    continue;
                }

                const booking = {
                    bookingId,
                    restaurantId,
                    tableId: table.id,
                    date,
                    time,
                    guests: Number(guests),
                    dinerName,
                    dinerId,
                    createdAt: new Date().toISOString()
                };
                tx.set(bookingRef, booking);
                return { status: 201, body: booking };
            }

            return { status: 409, body: { error: 'No table free at that time.' } };
        });

        if (result.status === 201) {
            const waiting = (await findBy('waitlist', 'dinerId', dinerId))
                .filter(w => w.restaurantId === restaurantId && w.date === date && w.time === time);
            await Promise.all(waiting.map(w =>
                store.collection('waitlist').doc(w.id).set({ status: 'booked' }, { merge: true })));
        }

        res.status(result.status).json(result.body);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// cancel booking

app.post('/bookings/cancel', async (req, res) => {
    try {
        const bookingRef = store.collection('bookings').doc(req.body.bookingId);
        const bookingDoc = await bookingRef.get();
        if (!bookingDoc.exists) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const booking = bookingDoc.data();
        const restaurant = await getRestaurant(booking.restaurantId);
        const table = restaurant.tables.find(t => t.id === booking.tableId);

        await bookingRef.delete();

        res.json({
            restaurantId: booking.restaurantId,
            tableId: booking.tableId,
            size: table.size,
            date: booking.date,
            time: booking.time
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// waitlist

app.post('/waitlist', async (req, res) => {
    try {
        const { restaurantId, dinerName, date, time, guests } = req.body;

        if (!restaurantId || !dinerName || !date || !time || !guests) {
            return res.status(400).json({ error: 'Missing required waitlist fields' });
        }

        const restaurant = await getRestaurant(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        const waitlistData = {
            restaurantId,
            dinerName,
            dinerId: getDiner(dinerName),
            date,
            time,
            guests: Number(guests),
            status: 'waiting',
            createdAt: new Date().toISOString()
        };

        const waitlistRef = await store.collection('waitlist').add(waitlistData);

        res.status(201).json({ message: 'Added to waitlist!', id: waitlistRef.id, ...waitlistData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// line for restaurant
app.get('/waitlist/:restaurantId', async (req, res) => {
    try {
        const { date, time } = req.query;
        const order = (await findBooking('waitlist', req.params.restaurantId, date))
            .filter(w => w.time === time && w.status === 'waiting')
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        res.json({ waitlist: order });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// complete res
app.patch('/confirm-waitlist/:waitlistId', async (req, res) => {
    try {
        const waitlistRef = store.collection('waitlist').doc(req.params.waitlistId);
        const waitlistDoc = await waitlistRef.get();

        if (!waitlistDoc.exists) {
            return res.status(404).json({ error: 'Waitlist entry not found' });
        }

        const updatedData = { ...req.body, updatedAt: new Date().toISOString() };
        await waitlistRef.set(updatedData, { merge: true });

        res.json({ message: 'Waitlist entry updated!', ...updatedData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// user views

app.get('/diners/:dinerId', async (req, res) => {
    try {
        const dinerId = req.params.dinerId;
        const waitlist = await findBy('waitlist', 'dinerId', dinerId);
        res.json({
            bookings: await findBy('bookings', 'dinerId', dinerId),
            waitlist,
            offers: waitlist.filter(w => w.status === 'offered')
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/restaurants/:id/day', async (req, res) => {
    try {
        const restaurant = await getRestaurant(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        const date = req.query.date;
        const bookings = await findBooking('bookings', restaurant.id, date);
        const waitlist = (await findBooking('waitlist', restaurant.id, date))
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        res.json({ restaurant, bookings, waitlist });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// demo reset
app.post('/reset', async (req, res) => {
    try {
        for (const name of ['restaurants', 'bookings', 'waitlist']) {
            await clear(name);
        }

        for (const r of samples.restaurants) {
            await store.collection('restaurants').doc(r.id).set({ ...r, timeSlots: samples.timeSlots });
        }

        for (const [restaurantId, tableId, date, time, guests, dinerName] of samples.bookings) {
            const bookingId = bookingExists(restaurantId, tableId, date, time);
            await store.collection('bookings').doc(bookingId).set({
                bookingId, restaurantId, tableId, date, time, guests,
                dinerName, dinerId: getDiner(dinerName)
            });
        }

        const now = Date.now();
        for (let i = 0; i < samples.waitlist.length; i++) {
            const [restaurantId, date, time, guests, dinerName] = samples.waitlist[i];
            await store.collection('waitlist').add({
                restaurantId, date, time, guests, dinerName,
                dinerId: getDiner(dinerName),
                status: 'waiting',
                createdAt: new Date(now + i).toISOString()
            });
        }

        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Local server running at http://localhost:${PORT}`);
});