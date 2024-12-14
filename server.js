import express from 'express';
import controllerRouting from './routes/index';

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
controllerRouting(app);
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
