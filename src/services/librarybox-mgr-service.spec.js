"use strict";

const chai = require("chai");
chai.use(require("chai-json-schema"));
const expect = chai.expect;
const { each } = require("lodash");
const {
    checkTelnetAccessible,
    setDeviceRootPassword,
    canLoginOverSSH,
    reconfigureLibraryBox
} = require("./librarybox-mgr-service");

if (!process.env.LIBRARYBOX_IP) {
    console.log("Please set LIBRARYBOX_IP in the environment. It needs to");
    console.log("  be set to the IP address of the librarybox device.");
    process.exit();
}

describe.skip("test configuring a librarybox", () => {
    afterEach(() => {});
    it("should determine whether telnet is accessible", async () => {
        try {
            let response = await checkTelnetAccessible({
                deviceIpAddress: "192.168.1.1"
            });
            expect(response).to.be.true;
        } catch (error) {
            expect(response).to.be.false;
        }
    });
    it(`should be able to set the device password over telnet or know it's been done`, async () => {
        try {
            let response = await setDeviceRootPassword({
                rootPassword: "paradisec",
                deviceIpAddress: "192.168.1.1"
            });
            expect(response).to.equal(
                "Root password set on device. Use SSH to login."
            );
        } catch (error) {
            expect(error.message).to.equal(
                "Telnet disabled on device. Use SSH."
            );
        }
    });
    it("should be able to log in over SSH", async () => {
        try {
            let response = await canLoginOverSSH({
                rootPassword: "paradisec",
                deviceIpAddress: "192.168.1.1"
            });
            expect(response).to.be.true;
        } catch (e) {
            expect(response).to.be.false;
        }
    }).timeout(5000);
    it("should be able to reconfigure a librarybox", async () => {
        try {
            await reconfigureLibraryBox({
                rootPassword: "paradisec",
                deviceIpAddress: "192.168.1.1"
            });
            // console.log(response);
        } catch (e) {
            console.log(e);
        }
    }).timeout(10000);
});
