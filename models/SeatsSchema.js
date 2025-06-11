const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const SeatSchema = new Schema({
    seatID: {
        type: String,
        required: true,
        unique: true
    },
    eventID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    isTaken: {
        type: Boolean,
        default: false
    },
    

}, { timestamps: true });
const Seat = mongoose.model('Seat', SeatSchema);
module.exports = Seat;