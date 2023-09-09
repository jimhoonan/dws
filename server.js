const express = require('express');
const multer = require('multer');
const axios = require('axios');
const app = express();
const PORT = 3000;

app.use(express.json());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './uploads');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });

const upload = multer({ storage: storage });

app.post('/api/upload-image', upload.single('file'), (req, res) => {
    res.json({ message: 'File uploaded successfully!' });
  });

// app.get('/api/lakelevel', async (req, res) => {
//     try {
//         const response = await axios.get('https://www.waterdatafortexas.org/reservoirs/recent-conditions.json', {
//             params: req.query
//         });
//         if (response.data.Travis) {
//             res.json({level: response.data.Travis.elevation})
//         }

//         res.json({level: 650});
//     } catch (error) {
//         res.status(500).json({ error: 'Request failed' });
//     }
// });

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});