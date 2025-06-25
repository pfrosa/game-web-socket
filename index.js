const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("WebSocket running");
});

const MESSAGE_TYPES = {
    CONNECT: 'connect',
    STATE_UPDATE: 'state_update',
}

const ROOMS = {};

const heartbeat = () => {
    this.isAlive = true;
}

const handleMessage = (client, messageJson) => {
    if (messageJson.messageType == MESSAGE_TYPES.CONNECT) {
        if (ROOMS[messageJson.room]) {
            ROOMS[messageJson.room].connectedClients.push(client);
            if(ROOMS[messageJson.room].connectedClients.length > 1){
                client.send(JSON.stringify({
                    messageType: MESSAGE_TYPES.STATE_UPDATE,
                    gameState: { player: 'black'}
                }));
            }
        } else {
            ROOMS[messageJson.room] = {
                connectedClients: [client],
                gameState: {}
            }
        }
    }

    if (messageJson.messageType == MESSAGE_TYPES.STATE_UPDATE) {
        //UPDATE ALL OTHER CLIENTS WITH THE STATE 
        const currentRoom = ROOMS[messageJson.room];
        currentRoom.gameState = messageJson.gameState;
        currentRoom.connectedClients.forEach((ws) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    messageType: MESSAGE_TYPES.STATE_UPDATE,
                    gameState: currentRoom.gameState
                }));
            }
        });
    }


    console.log(ROOMS);
}


const wss = new WebSocket.Server({ server });
wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    ws.isAlive = true;
    ws.ip = ip;

    //add id as unique identifier
    ws.on('error', console.error);

    console.log('Client conected');

    ws.on('message', (message) => {
        //console.log(wss.clients); // all clients
        try {
            const messageJson = JSON.parse(message);
            handleMessage(ws, messageJson);
        } catch (error) {
            console.error(error)
        }
    });

    //Check for inative clients
    const interval = setInterval(function ping() {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) return ws.terminate();
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);

    ws.on('close', () => {
        //Remove itself from rooms on disconnect
        Object.values(ROOMS).forEach(room => {
            const indexOfClient = room.connectedClients.indexOf(ws);
            if (indexOfClient !== -1) {
                room.connectedClients.splice(indexOfClient, 1);
            }
        })
        console.log('Client desconected');
    });

    ws.on('pong', heartbeat);
    clearInterval(interval);
});


// Iniciar o servidor
server.listen(PORT, () => {
    console.log(`Server running on port:${PORT}`);
});