const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const db = require('./firebase'); // Firebase Firestore instance
require('dotenv').config();

// Express setup for QR code display
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let latestQr = null;

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// WebSocket for QR code updates
io.on('connection', (socket) => {
    if (latestQr) {
        socket.emit('qr', latestQr);
    }
});

// WhatsApp Client with session persistence
const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
        if (!err) {
            latestQr = url;
            io.emit('qr', url);
        }
    });
});

client.on('ready', () => {
    console.log('WhatsApp Bot is ready!');
});

// Categorization logic
const categories = {
    orders: [
        'bhel', 'mixture','sev', 'pappadi', 
        'pori', 'puri', 'poori', 'masala', 
        'peanut', 'broken', 'golgoppa',
        'boondhi', 'boondi' 
    ]
};

function categorizeMessage(message) {
    for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some((keyword) => message.toLowerCase().includes(keyword))) {
            return category;
        }
    }
    return null; // Only save messages with keywords
}

client.on('message', (msg) => {
    if (msg.isGroupMsg) {
        console.log(`Group Name: ${msg.chat.name}`);
        console.log(`Group ID: ${msg.from}`);
    }
});

// Target group ID (replace with the actual group ID where you want to forward messages)
const targetGroupId = "120363027244797982@g.us"

// Listen to incoming messages
client.on('message', async (msg) => {
    const messageText = msg.body;
    const sender = msg.from;
    const contact = await msg.getContact();
    const senderName =  contact.name || contact.number;

    // Categorize the message
    const category = categorizeMessage(messageText);

    if (category) {
        const formattedMessage = `${senderName}:\n${messageText}`;

        // Save the message to Firebase
        const messageRef = db.collection('messages').doc();

        try {
            // Uncomment if you want to save to Firestore
            // await messageRef.set({
            //     sender: sender,
            //     message: messageText,
            //     category: category,
            //     timestamp: new Date(),
            // });

            // Forward the categorized message to the target group
            await client.sendMessage(targetGroupId, formattedMessage);
            console.log(`Message forwarded to group: ${formattedMessage}`);
        } catch (error) {
            console.error('Error forwarding message:', error);
        }
    }
});

// Start the WhatsApp client
client.initialize();

// Start the Express server for QR code
server.listen(3000, () => {
    console.log('QR code server running at http://localhost:3000');
});