const express = require('express');
const app = express();
const DB = require('./mongoDB').connectDb;
require('dotenv').config(); 
const bookingController = require('./controllers/bookingController');
DB();

app.use(express.json()); 
app.get('/api/events/:eventID/seats', bookingController.getEventSeats);
app.post('/api/bookings/lock-seats', bookingController.lockSeats);
app.post('/api/bookings/unlock-seats', bookingController.unlockSpecificSeats);

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
