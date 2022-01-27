const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const { customAlphabet, urlAlphabet } = require('nanoid')

const nanoid = customAlphabet(urlAlphabet, 6)

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

let pairedTo = {};
let connections = {};
let pairIds = {};
io.on('connection', (socket) => {
    let connectionId = nanoid();
    connections[connectionId] = socket;
    socket.emit('token', connectionId);
    socket.on('code', (nfc) => {
        if (pairedTo[connectionId]) {
            pairedTo[connectionId].emit('nfc', nfc);
        }
        socket.emit('nfc', nfc);
    });

    socket.on('pair', (pair) => {
        pairedTo[pair] = socket;
        pairIds[connectionId] = pair;
        pairIds[pair] = connectionId;
        pairedTo[connectionId] = connections[pair];
        pairedTo[connectionId].emit('paired', connectionId)
    })

    socket.on('disconnect', () => {
        let pairId = pairIds[connectionId];
        delete pairedTo[connectionId];
        delete pairedTo[pairId];
        delete connections[connectionId];
        delete pairIds[pairId];
        delete pairIds[connectionId];
        if (pairId) {
            connections[pairId]?.emit('unpair');
        }
    });
});


server.listen(3000, () => {
    console.log('listening on *:3000');
});