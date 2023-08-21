const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/api/lakelevel', async (req, res) => {
    try {
        const response = await axios.get('https://www.waterdatafortexas.org/reservoirs/recent-conditions.json', {
            params: req.query
        });
        if (response.data.Travis) {
            res.json({level: response.data.Travis.elevation})
        }

        res.json({level: 650});
    } catch (error) {
        res.status(500).json({ error: 'Request failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});