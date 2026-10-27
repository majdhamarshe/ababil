import 'dotenv/config';
import { createApp } from './app.js';
import { connectDatabase } from './config/db.js';

const port = Number(process.env.PORT || 5000);
connectDatabase(process.env.MONGODB_URI)
  .then(() =>
    createApp().listen(port, '0.0.0.0', () =>
      console.log(`Ababil API is running at http://localhost:${port}`)
    )
  )
  .catch((error) => {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  });
