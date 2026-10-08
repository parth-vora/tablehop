import express from 'express';
import {Firestore} from '@google-cloud/firestore';
import * as samples from './samples.js';

const store = new Firestore();
const app = express();
app.use(express.json());

app.use((req, res, next) => {
    if (req.get('x-api-key') !== process.env.API_KEY) {
        return res.status(401).send('Unauthorized');
    }
    next();
});

async function allRestaurants(group){
    const bookingsRef = await store.group(group).get();
    return bookingsRef.docs.map(doc => doc.data());
}

async function findBooking(group, bookingId,value){
    const bookingsRef = await store.groupgroup(group).where('bookingId', '==', bookingId).where('value', '==', value).get();
    return bookingsRef.docs.map(doc => doc.data());
}

async function getRestaurant(id){
    const restaurantRef = await store.collection('restaurants').doc(id).get();
    return restaurantRef.data();
}   

function getDiner(name){
    return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

function bookingExists(restarantId, tableId, date, time){
    return '${restarantId}_${tableId}_${date}_${time}';
}

app.get('/restaurants', async (req, res) => {
    res.json(await allRestaurants(req.query.group));
});

app.get('/restaurants/:id', async (req, res) => {
    const restaurant = await getRestaurant(req.params.id);
    if (!restaurant) {
        return res.status(404).send('Restaurant not found');
    }

    const date = req.query.date;
    const guests = Number(req.query.guests || 2);
    const bookings = (await findBooking(req.query.group, req.params.id, date)).filter(b => b.guests >= guests);

    const availableTables = restaurant.tables.filter(table => {
        const bookingKey = bookingExists(req.params.id, table.id, date, req.query.time);
        return !bookings.some(b => b.bookingKey === bookingKey);
    }

    );
    res.json({
        ...restaurant,
        availableTables
    });
}
);


