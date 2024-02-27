const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cardSchema = new Schema({
    word: String,
    definition: String,
    section: {
        type: Schema.Types.ObjectId,
        ref: 'Section'
    }
}, { timestamps: true });

module.exports = mongoose.model('Card', cardSchema);
