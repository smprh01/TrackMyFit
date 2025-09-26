require("dotenv").config();
const mongoose = require("mongoose");
 
console.log("MONGO_URI:", process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)

.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

// Your schema and model below
const LogInSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    results: [
        {
            date: String,
            fluidintakestatus: String,
            mealsstatus: String,
            fruitssnackjunkfoodstatus: String
        }
    ]
});

const collection = mongoose.model("LogInConnection", LogInSchema);
module.exports = collection;
