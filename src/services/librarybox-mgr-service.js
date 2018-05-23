'use strict';

const Telnet = require('telnet-client');

module.exports = {
    setDeviceRootPassword
};

async function setDeviceRootPassword(deviceIpAddress) {
    const connection = new Telnet();

    const params = {
        host: '192.168.1.1',
        port: 23,
        timeout: 1500
    };

    return new Promise(async function(resolve, reject) {
        try {
            connection.on('close', () => {
                reject(new Error('Telnet disabled on device. Use SSH.'));
            });
            connection.on('error', e => {
                reject(new Error('Telnet disabled on device. Use SSH.'));
            });
            await connection.connect(params);
            let stream = await connection.shell();
            await stream.write('/usr/bin/passwd');
            await stream.write('\r\n');
            stream.on('data', async d => {
                if (d.toString('utf8').match(/New password:/)) {
                    await stream.write('paradisec');
                    await stream.write('\r\n');
                }
                if (d.toString('utf8').match(/Retype password:/)) {
                    await stream.write('paradisec');
                    await stream.write('\r\n');
                }
                resolve('Root password set on device. Use SSH to login.');
            });
        } catch (e) {
            reject(e);
        }
    });
}
