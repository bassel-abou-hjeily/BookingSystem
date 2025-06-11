const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const OrdersSchema = new Schema({
    orderID: {
        type: String,
        required: true,
        unique: true
    },
    customerID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true

    },
    currency: {
        type: String,
        default: 'USD'

    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'cancelled'],
        default: 'pending'
    }
},{timestamps: true});
const Order = mongoose.model('Order', OrdersSchema);
module.exports = Order;