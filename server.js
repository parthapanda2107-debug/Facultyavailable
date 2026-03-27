const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const FACULTY_SECRET = "NISTFACULTY@2026";

let freeTimes = [
    { 
        id: 1, 
        facultyName: "Dr. Smith", 
        date: "2026-03-30", 
        startTime: "10:00", 
        endTime: "11:00",
        roomNumber: "A-102",
        region: "LHC" 
    },
];

// --- AUTHENTICATION ROUTES ---
app.post('/api/login/faculty', (req, res) => {
    const { facultyName, secretCode } = req.body;
    if (secretCode === FACULTY_SECRET && facultyName) {
        return res.json({ success: true, role: 'faculty', name: facultyName });
    }
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
});

app.post('/api/login/student', (req, res) => {
    const { rollNumber, branch, year } = req.body;
    if (rollNumber && branch && year) {
        return res.json({ success: true, role: 'student', details: { rollNumber, branch, year } });
    }
    return res.status(400).json({ success: false, message: 'Missing fields.' });
});

// --- EXISTING ENDPOINTS ---
app.get('/api/freetimes', (req, res) => {
    res.json(freeTimes);
});

app.post('/api/freetimes', (req, res) => {
    const { facultyName, date, startTime, endTime, roomNumber, region } = req.body;
    if (!facultyName || !date || !startTime || !endTime || !region) {
        return res.status(400).json({ error: "Missing required fields." });
    }
    const newFreeTime = {
        id: freeTimes.length > 0 ? Math.max(...freeTimes.map(a => a.id)) + 1 : 1,
        facultyName, date, startTime, endTime, roomNumber: roomNumber || "TBD", region
    };
    freeTimes.push(newFreeTime);
    res.status(201).json(newFreeTime);
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server is running on port ${PORT}`));
