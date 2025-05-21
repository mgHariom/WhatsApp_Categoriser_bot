const { Client } = require('whatsapp-web.js');
const client = new Client();

client.on('ready', async () => {
    console.log('Client is ready!');

    // Fetch all chats
    const chats = await client.getChats();

    // Filter for group chats
    const groups = chats.filter(chat => chat.isGroup);

    // Print group names and their IDs
    groups.forEach(group => {
        console.log(`Group: ${group.name}, ID: ${group.id._serialized}`);
    });
});

client.initialize();
