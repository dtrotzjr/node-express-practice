let mongoose = require('mongoose');

let User = mongoose.model('User', {
    name: {
        type: String,
        required: true,
        minlength: 1,
        trim: true

    },
    age: {
        type: Number,
        required: true
    }
});

module.exports = {User};