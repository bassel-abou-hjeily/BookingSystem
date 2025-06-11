const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const Seat = require('../models/SeatsSchema');
const SeatLock = require('../models/SeatLock');
const Order = require('../models/OrdersSchema');
const Reservation = require('../models/ReservationSchema');
const Event = require('../models/EventsSchema');

const LOCK_DURATION_MS = 5 * 60 * 1000;

exports.getEventSeats = async (req, res) => {
    try {
        const { eventID } = req.params;

        const event = await Event.findOne({ eventID });
        if (!event) return res.status(404).json({ message: 'Event not found.' });

        const seats = await Seat.find({ eventID: event._id });
        const activeLocks = await SeatLock.find({ expiresAt: { $gt: new Date() } });

        const lockedSeatIds = new Set();
        activeLocks.forEach(lock => {
            lock.seatIDs.forEach(id => lockedSeatIds.add(id.toString()));
        });

        const seatsWithStatus = seats.map(seat => {
            let status = 'available';
            if (seat.isTaken) status = 'taken';
            else if (lockedSeatIds.has(seat._id.toString())) status = 'locked';

            return {
                seatID: seat.seatID,
                _id: seat._id,
                name: seat.name,
                status
            };
        });

        res.status(200).json(seatsWithStatus);
    } catch (error) {
        console.error('Error fetching event seats:', error);
        res.status(500).json({ message: 'Server error while fetching seats.' });
    }
};

exports.lockSeats = async (req, res) => {
    const { eventID, seatIDs, customerID } = req.body;

    if (!eventID || !seatIDs || !Array.isArray(seatIDs) || seatIDs.length === 0 || !customerID) {
        return res.status(400).json({ message: 'Invalid request payload. eventID, seatIDs, and customerID are required.' });
    }

    const seatObjectIDs = seatIDs.map(id => new mongoose.Types.ObjectId(id));
    const customerObjectID = new mongoose.Types.ObjectId(customerID);
    const eventObjectID = new mongoose.Types.ObjectId(eventID);
    const lockExpirationTime = new Date(Date.now() + LOCK_DURATION_MS);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const validSeatObjectIDs = [];
        const failedSeatNames = [];

        for (const seatObjectID of seatObjectIDs) {
            const seat = await Seat.findById(seatObjectID).session(session);
            if (!seat) {
                failedSeatNames.push(`Unknown seat with ID: ${seatObjectID}`);
                continue;
            }
            if (seat.isTaken) {
                failedSeatNames.push(seat.name);
                continue;
            }

            const existingLock = await SeatLock.findOne({
                seatIDs: seat._id,
                expiresAt: { $gt: new Date() }
            }).session(session);

            if (existingLock) {
                failedSeatNames.push(seat.name);
                continue;
            }

            validSeatObjectIDs.push(seat._id);
        }

        if (failedSeatNames.length > 0) {
            await session.abortTransaction();
            return res.status(409).json({
                message: 'Some seats could not be locked as they are already taken or reserved.',
                failedSeatNames,
                lockedSeatIDs: []
            });
        }

        await SeatLock.create([{
            lockID: uuidv4(),
            customerID: customerObjectID,
            eventID: eventObjectID,
            seatIDs: validSeatObjectIDs,
            lockedAt: new Date(),
            expiresAt: lockExpirationTime,
        }], { session });

        await session.commitTransaction();
        res.status(200).json({
            message: 'Seats locked successfully.',
            lockedSeatIDs: validSeatObjectIDs.map(id => id.toString()),
            expiresAt: lockExpirationTime
        });
    } catch (error) {
        await session.abortTransaction();
        console.error('Error locking seats:', error);
        res.status(500).json({ message: 'Failed to lock seats due to an internal server error.' });
    } finally {
        session.endSession();
    }
};


exports.unlockSpecificSeats = async (req, res) => {
    const { eventID, customerID, seatIDsToUnlock } = req.body;

    if (!eventID || !customerID || !seatIDsToUnlock || !Array.isArray(seatIDsToUnlock) || seatIDsToUnlock.length === 0) {
        return res.status(400).json({ message: 'eventID, customerID, and seatIDsToUnlock (as an array) are required.' });
    }

    const customerObjectID = new mongoose.Types.ObjectId(customerID);
    const eventObjectID = new mongoose.Types.ObjectId(eventID);
    const seatObjectIDsToUnlock = seatIDsToUnlock.map(id => new mongoose.Types.ObjectId(id));

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const seatLock = await SeatLock.findOne({
            customerID: customerObjectID,
            eventID: eventObjectID,
            expiresAt: { $gt: new Date() }
        }).session(session);

        if (!seatLock) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'No active lock found for this customer on this event.' });
        }

        const seatsSuccessfullyUnlocked = [];

        seatLock.seatIDs = seatLock.seatIDs.filter(lockedSeatId => {
            const shouldUnlock = seatObjectIDsToUnlock.some(id => id.equals(lockedSeatId));
            if (shouldUnlock) seatsSuccessfullyUnlocked.push(lockedSeatId.toString());
            return !shouldUnlock;
        });

        if (seatsSuccessfullyUnlocked.length === 0) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'None of the provided seat IDs were found in the lock.' });
        }

        let message;
        if (seatLock.seatIDs.length === 0) {
            await SeatLock.deleteOne({ _id: seatLock._id }).session(session);
            message = 'All locked seats successfully unlocked and lock removed.';
        } else {
            await seatLock.save({ session });
            message = 'Selected seats unlocked successfully.';
        }

        await session.commitTransaction();
        res.status(200).json({
            message,
            unlockedSeatIDs: seatsSuccessfullyUnlocked,
            remainingLockedSeatIDs: seatLock.seatIDs.map(id => id.toString())
        });
    } catch (error) {
        await session.abortTransaction();
        console.error('Error unlocking specific seats:', error);
        res.status(500).json({ message: 'Failed to unlock seats due to an internal server error.' });
    } finally {
        session.endSession();
    }
};
