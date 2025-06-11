const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ReservationsSchema = new Schema({
    reservationID: {
        type: String,
        required: true,
        unique: true
    },
    customerID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    eventID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    seatIDs: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Seat',
        required: true
    },
    orderID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    }
},{timestamps: true});
const Reservation = mongoose.model('Reservation', ReservationsSchema);
module.exports = Reservation;