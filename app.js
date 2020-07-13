require('dotenv').config()

const tmi = require('tmi.js');
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
const dbName = 'zerator-chat';

MongoClient.connect(url, function (err, client) {
    console.log("Connected successfully to server");

    (new ZeratorChatMessages(client.db(dbName))).init();
});

class ZeratorChatMessages {
    constructor(db) {
        this.db = db;

        this.tmiClient = new tmi.Client({
            connection: {
                reconnect: true,
                secure: true,
            },
            identity: {
                username: process.env.TWITCH_USERNAME,
                password: process.env.TWITCH_OAUTH,
            },
            channels: ['zerator'],
        });
    }

    init() {
        this.tmiClient.connect().catch(console.error);
        this.tmiClient.on('message', (channel, tags, message, self) => {
            if (self) return;
            this.insertMessage(channel, tags, message, self).catch((err) => {
                console.log(err)
            });
        });
    }

    async insertMessage(channel, tags, message, self) {
        const collection = this.db.collection('chat');
        return collection.insertOne({channel, tags, message, self, date: new Date()}, {});
    }
}
