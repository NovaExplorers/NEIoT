import { ACT, authenticate, execute } from "tl-api";
import chalk from 'chalk';

let info, context;


const lteConnect = async () => {
    let el = await authenticate(process.env.LTE_URL, {
        password: process.env.LTE_PASS,
    });
    info = el.info;
    context = { ...el };

    if(context.sessionId || context.tokenId) return console.log(chalk.bgGreen('Successfully connected to LTE Router!'))
    else console.log(chalk.bgRed('Error while connecting to LTE Router'));
}

const getInfo = async (key, values) => {
    if(!info) return console.log(chalk.bgRed('Trying to getDataUsage while connection is not initiated'));

    const result = await execute(
        process.env.LTE_URL,
        [
            [
                ACT.GL,
                key,
                [
                    ...values
                ],
            ],
        ],
        context
    );


    if(result.error != 0) return console.log(chalk.bgRed(`Encountered error ${result.error} while trying to get data usage`));

    return result.actions[0].res[1].attributes;

}

const getDataUsage = async () => {
    let { dataUsage } = await getInfo('WAN_LTE_INTF_CFG', ['totalStatistics']);

    dataUsage = parseInt(dataUsage);

    return dataUsage;
}

const getLTELink = async () => {
    let simStatusString = ["Unknown", "No SIM card", "SIM card error", "Ready", "PIN required", "PIN unlocked", "PUK required", "Blocked"];
    let networkType_str = ["No Service", "GSM", "WCDMA", "4G LTE", "TD-SCDMA", "CDMA 1x", "CDMA 1x Ev-Do", "4G+ LTE"];

    let { signalStrength, networkType, simStatus, ipv4 } = await getInfo('WAN_LTE_LINK_CFG', ['signalStrength', 'networkType', 'simStatus',  'ipv4']);

    signalStrength = parseInt(signalStrength) * 25;
    networkType = networkType_str[parseInt(networkType)];
    simStatus = simStatusString[parseInt(simStatus)];

    return {signalStrength, networkType, simStatus, ipv4};
}

const getProfileInfo = async () => {
    let { spn: ispLongName } = await getInfo('LTE_PROF_STAT', ['spn']);

    return ispLongName;
}

const getWLANClients = async () => {
    if(!info) return console.log(chalk.bgRed('Trying to getWLANClients while connection is not initiated'));

    const result = await execute(
        process.env.LTE_URL,
        [
            [
                ACT.GL,
                'LAN_HOST_ENTRY',
                [
                    'IPAddress',
                    'MACAddress',
                    'hostName',
                    'active',
                    'X_TP_ConnType'
                ],
            ],
        ],
        context
    );

    const formattedList = result.actions[0].res.filter(el => el.attributes.X_TP_ConnType == 1).map(el => {
        let { IPAddress: ip, MACAddress: mac, hostName: hostname, active} = el.attributes;
        hostname = hostname || 'Unknown';
        return { ip, mac, hostname, active }
    })


    if(result.error != 0) return console.log(chalk.bgRed(`Encountered error ${result.error} while trying to get data usage`));

    return formattedList;
}

const getLANClients = async () => {
    if(!info) return console.log(chalk.bgRed('Trying to getDataUsage while connection is not initiated'));

    const result = await execute(
        process.env.LTE_URL,
        [
            [
                ACT.GL,
                'LAN_HOST_ENTRY',
                [
                    'IPAddress',
                    'MACAddress',
                    'hostName',
                    'active',
                    'X_TP_ConnType'
                ],
            ],
        ],
        context
    );

    const formattedList = result.actions[0].res.filter(el => el.attributes.X_TP_ConnType == 0 && el.attributes.active == 1).map(el => {
        let { IPAddress: ip, MACAddress: mac, hostName: hostname, active} = el.attributes;
        hostname = hostname || 'Unknown';
        return { ip, mac, hostname, active }
    })


    if(result.error != 0) return console.log(chalk.bgRed(`Encountered error ${result.error} while trying to get data usage`));

    return formattedList;
}



export default { getDataUsage, lteConnect, getLTELink, getWLANClients, getLANClients, getProfileInfo };
