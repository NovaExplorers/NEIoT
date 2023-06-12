import dotenv from 'dotenv';
import { initClient } from './utils/socket.js';
import connection from './lte/connection.js';

dotenv.config();

connection.lteConnect()
    .then(()=> initClient())


