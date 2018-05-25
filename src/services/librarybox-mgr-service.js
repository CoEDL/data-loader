'use strict';

const Telnet = require('telnet-client');
const SSHClient = require('ssh2').Client;
const util = require('util');

module.exports = {
    checkTelnetAccessible,
    setDeviceRootPassword,
    canLoginOverSSH,
    reconfigureLibraryBox
};

async function checkTelnetAccessible({deviceIpAddress}) {
    const connection = new Telnet();

    const params = {
        host: deviceIpAddress,
        port: 23,
        timeout: 1500,
        debug: true
    };

    return new Promise(async function(resolve, reject) {
        try {
            connection.on('ready', d => {
                if (d == '/(?:\\/ )?#\\s/') {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
            connection.on('data', d => {
                resolve(true);
            });
            connection.on('close', () => {
                resolve(false);
            });
            connection.on('error', e => {
                resolve(false);
            });
            await connection.connect(params);
        } catch (e) {
            resolve(false);
        }
    });
}

async function setDeviceRootPassword({rootPassword, deviceIpAddress}) {
    const connection = new Telnet();

    const params = {
        host: deviceIpAddress,
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
            stream.write('/usr/bin/passwd');
            stream.write('\r\n');
            stream.on('data', async d => {
                if (d.toString('utf8').match(/New password:/)) {
                    stream.write(rootPassword);
                    stream.write('\r\n');
                }
                if (d.toString('utf8').match(/Retype password:/)) {
                    stream.write(rootPassword);
                    stream.write('\r\n');
                    resolve();
                }
            });
        } catch (e) {
            reject(e);
        }
    });
}

async function canLoginOverSSH({rootPassword, deviceIpAddress}) {
    const conn = new SSHClient();
    return new Promise(function(resolve, reject) {
        conn
            .on('ready', () => resolve(true))
            .on('error', () => resolve(false))
            .connect({
                host: deviceIpAddress,
                port: 22,
                username: 'root',
                password: rootPassword
            });
    });
}

async function reconfigureLibraryBox({rootPassword, deviceIpAddress}) {
    const connection = await getSSHConnection({rootPassword, deviceIpAddress});
    const stream = await getSSHStream(connection);
    let response = await streamExecute(stream, [
        'cd /opt/piratebox',
        '[[ -d www ]] && mv www www.orig',
        '[[ ! -L www ]] && ln -sf /mnt/usb/LibraryBox/www www',
        'cd /opt/piratebox/conf/lighttpd',
        '[[ ! -f lighttpd.conf.orig ]] && cp lighttpd.conf lighttpd.conf.orig',
        'exit'
    ]);
    // console.log(connection);
    // console.log(stream);
}

function getSSHConnection({rootPassword, deviceIpAddress}) {
    return new Promise(function(resolve, reject) {
        const connection = new SSHClient();
        connection.on('ready', () => resolve(connection));
        connection.on('error', () => reject(error));
        connection.connect({
            host: deviceIpAddress,
            port: 22,
            username: 'root',
            password: rootPassword,
            debug: true
        });
    });
}

async function streamExecute(stream, cmds) {
    return new Promise(async function(resolve, reject) {
        let stdout = 'stdout: ';
        let stderr = 'stderr: ';
        stream.on('data', d => {
            stdout += d;
        });
        stream.on('close', code => {
            resolve();
        });
        stream.stderr.on('data', d => (stderr += d));
        cmds.forEach(cmd => {
            stream.write(`${cmd}\r\n`);
        });
    });
}

async function getSSHStream(connection) {
    return new Promise(function(resolve, reject) {
        connection.shell(function(error, stream) {
            if (error) reject(error);
            resolve(stream);
        });
    });
}
