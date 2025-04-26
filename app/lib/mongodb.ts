import mongoose from 'mongoose'

const connectToDB = async () => {
    let connectionString = process.env.MONGODB_URI || ''
    if (!connectionString) {
        throw new Error('MONGODB_URI is not set')
    }

    try {
        await mongoose.connect(connectionString + '?authSource=admin')
        console.log('Connected to MongoDB')
    } catch (error) {
        console.log('Error connecting to MongoDB', error)
    }
}

export default connectToDB