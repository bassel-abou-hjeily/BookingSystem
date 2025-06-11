
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SeatLockSchema = new Schema({
    lockID: {
        type: String,
        required: true,
        unique: true
    },
   
    customerID: {
        type: Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
        seatIDs: [{ type: Schema.Types.ObjectId, ref: 'Seat', required: true }], 
    
    eventID: { type: Schema.Types.ObjectId, ref: 'Event', required: true }, 
    lockedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, { timestamps: true });
SeatLockSchema.index({ "expiresAt": 1 }, { expireAfterSeconds: 0 });

const SeatLock = mongoose.model('SeatLock', SeatLockSchema);
module.exports = SeatLock;
