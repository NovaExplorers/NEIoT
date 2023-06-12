import chalk from "chalk";
import { io } from "socket.io-client";
import connection from "../lte/connection.js";

let deviceInfo;

let socket;

const initClient = () => {
    socket = io(process.env.CENTRAL_SERVER_URL, {
        reconnection: true
    });


    socket.emit('handshake', {
        type: 2,
        id: process.env.ID,
        secret: process.env.SECRET
    });

    socket.on('handshakeResponse', arg => {
        if(arg.success == true) console.log(chalk.bgGreen('Successfully connected to main server'));
        deviceInfo = arg;
        console.log(arg);
    })
    
    socket.on('lte', arg => lteHandler({...arg}));
    socket.on('disconnect', () => {
        console.log(chalk.bgRed('Disconnected from server.'))
    });

}

const lteHandler = async ({ functionName, requestId }) => {
    const response = await connection[functionName]();
    socket.emit('lteResponse', {
        value: response,
        requestId
    });
}

export { initClient };