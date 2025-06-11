const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const EventSchema = new Schema({
    eventID: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    }
},{timestamps:true});
const Event = mongoose.model('Event', EventSchema);
module.exports = Event;