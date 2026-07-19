import mongoose from "mongoose";

const db = async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI)
        // console.log("data connect succfully")
    } catch (error) {
        console.log({message:error.message})
    }
}

export default db;