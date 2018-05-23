'use strict';

const chai = require('chai');
chai.use(require('chai-json-schema'));
const expect = chai.expect;
const {each} = require('lodash');
const {setDeviceRootPassword} = require('./librarybox-mgr-service');

if (!process.env.LIBRARYBOX_IP) {
    console.log('Please set LIBRARYBOX_IP in the environment. It needs to');
    console.log('  be set to the IP address of the librarybox device.');
    process.exit();
}

describe.only('test configuring a librarybox', () => {
    afterEach(() => {});
    it(`should be able to set the device password over telnet or know it's been done`, async () => {
        try {
            let response = await setDeviceRootPassword(
                process.env.LIBRARYBOX_IP
            );
            expect(response).to.equal(
                'Root password set on device. Use SSH to login.'
            );
        } catch (error) {
            expect(error.message).to.equal(
                'Telnet disabled on device. Use SSH.'
            );
        }
    });
});
