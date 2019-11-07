'use strict';

const chai = require('chai');
chai.use(require('chai-json-schema'));
const expect = chai.expect;
const fs = require('fs-extra');
const util = require('util');
const stat = util.promisify(fs.stat);
import path from 'path';
import {DataLoader} from './data-service';
import {SiteGenerator} from './site-generator';

describe('test static site generation capability', () => {
    let dataLoader;
    const localDataPath = path.join(__dirname, 'test-data');
    const usbMountPoint = path.join(__dirname, './tmp');
    before(() => {
        dataLoader = new DataLoader({
            params: {
                usbMountPoint,
                targetDevice: 'USB Disk',
                localDataPath,
            },
        });
        try {
            fs.mkdirSync(usbMountPoint, {recursive: true});
        } catch (error) {
            // do nothing
        }
    });
    after(async () => {
        fs.remove(usbMountPoint);
    });
    it('should be able to create a static site', async () => {
        let result = await dataLoader.prepareTarget();
        const {folders, errors} = await dataLoader.walk();
        let {items, collections} = dataLoader.buildIndex({folders});
        const siteGenerator = new SiteGenerator({
            store: undefined,
            index: items,
            target: usbMountPoint,
        });
        siteGenerator.generate();

        items.forEach(async item => {
            const path = `${usbMountPoint}/catalog/${item.collectionId}/${item.itemId}`;
            expect((await stat(path)).isDirectory()).to.be.true;
            ['files', 'information', 'images', 'media', 'documents'].forEach(
                async component => {
                    expect((await stat(`${path}/${component}`)).isDirectory())
                        .to.be.true;
                }
            );
        });
    }).timeout(20000);
});
