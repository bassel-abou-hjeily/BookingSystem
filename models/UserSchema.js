// models/User.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true 
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true 
    },
    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: 'customer'
    }
}, { timestamps: true }); 

const User = mongoose.model('User', UserSchema);
module.exports = User;