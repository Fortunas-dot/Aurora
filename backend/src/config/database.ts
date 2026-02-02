import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    let mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Ensure database name is 'aurora' (not 'test' or any other name)
    // Parse the URI and replace the database name if needed
    try {
      const url = new URL(mongoURI);
      // Remove existing database name from pathname
      url.pathname = '/aurora';
      mongoURI = url.toString();
    } catch (e) {
      // If URL parsing fails (e.g., mongodb+srv://), try string replacement
      // Replace /test with /aurora, or append /aurora if no database specified
      if (mongoURI.includes('/test')) {
        mongoURI = mongoURI.replace('/test', '/aurora');
      } else if (mongoURI.includes('mongodb+srv://') && !mongoURI.match(/\/[^/?]+(\?|$)/)) {
        // mongodb+srv:// without database name, add /aurora
        mongoURI = mongoURI.replace(/(mongodb\+srv:\/\/[^/]+)(\?|$)/, '$1/aurora$2');
      } else if (mongoURI.includes('mongodb://') && !mongoURI.match(/\/[^/?]+(\?|$)/)) {
        // mongodb:// without database name, add /aurora
        mongoURI = mongoURI.replace(/(mongodb:\/\/[^/]+)(\?|$)/, '$1/aurora$2');
      } else if (!mongoURI.includes('/aurora')) {
        // If database name exists but is not 'aurora', replace it
        mongoURI = mongoURI.replace(/\/([^/?]+)(\?|$)/, '/aurora$2');
      }
    }

    await mongoose.connect(mongoURI);
    
    console.log('✅ MongoDB Connected Successfully to database: aurora');
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error);
    process.exit(1);
  }
};

export default connectDB;






