const express = require('express');
require('dotenv').config();

const usersRouter = require('./routes/users');
const categoriesRouter = require('./routes/categories');
const clothingRouter = require('./routes/clothing');
const outfitsRouter = require('./routes/outfits');
const outfitItemsRouter = require('./routes/outfitItems');

const app = express();

const PORT = process.env.PORT || 9000;

app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: 'Digital Wardrobe API is running'
    });
});

app.use('/api/users', usersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/clothing', clothingRouter);
app.use('/api/outfits', outfitsRouter);
app.use('/api/outfit-items', outfitItemsRouter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});