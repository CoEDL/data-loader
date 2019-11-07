'use strict';

import 'core-js/stable';
import 'regenerator-runtime/runtime';
const chai = require('chai');
chai.use(require('chai-json-schema'));
const expect = chai.expect;
const fs = require('fs-extra');
import path from 'path';
import {DataLoader} from './data-service';

const loggers = {
    logInfo: msg => {
        // console.log(msg);
    },
    logComplete: msg => {
        // console.log(msg);
    },
    logError: msg => {
        // console.log(msg);
    },
};

describe('test data service methods', () => {
    let dataLoader;
    const localDataPath = path.join(__dirname, 'test-data');
    const usbMountPoint = path.join(__dirname, './tmp');
    before(() => {
        dataLoader = new DataLoader({
            params: {
                usbMountPoint,
                targetDevice: 'Raspberry Pi',
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
    it('should be able to prepare the target device for data loading', async () => {
        let result = await dataLoader.prepareTarget();
        expect(result).to.be.true;
        let content = fs.readdirSync(usbMountPoint);
        expect(content).to.deep.equal(['html']);
        content = fs.readdirSync(`${usbMountPoint}/html`);
        expect(content).to.deep.equal(['repository']);
    });
    it('should be able to build a tree of data files to load', async () => {
        const {folders, errors} = await dataLoader.walk();
        expect(folders).to.be.an('array');
        const folder = folders.filter(
            f => f.file === 'DT1-214-CAT-PDSC_ADMIN.xml'
        );
        expect(folder).to.deep.equal([
            {
                folder:
                    '/Users/mlarosa/src/pdsc/data-loader/src/services/test-data/DT1/214',
                type: 'CAT-XML',
                file: 'DT1-214-CAT-PDSC_ADMIN.xml',
            },
        ]);
    });
    it('should be able to create an index file with all of the data', async () => {
        const {folders, errors} = await dataLoader.walk();
        let {items, collections} = dataLoader.buildIndex({folders});
        expect(items).to.be.an('array');
        const itemIds = items.map(item => item.itemId).sort();
        expect(itemIds).to.deep.equal([
            '214',
            '521',
            '940',
            '98007',
            'TokelauOf',
        ]);
        expect(collections.map(c => c.collectionId).sort()).to.deep.equal([
            'DT1',
            'NT1',
            'NT5',
        ]);
    });
    it('should be able to install the collection viewer', async () => {
        let result = await dataLoader.prepareTarget();
        dataLoader.installCollectionViewer();
        const content = fs.readdirSync(`${usbMountPoint}/html`);
        expect(content.includes('index.html')).to.be.true;
        expect(content.includes('main.css')).to.be.true;
        expect(content.includes('repository')).to.be.true;
        expect(content.includes('res')).to.be.true;
    });
    it('should be able to install the data and write the index file', async () => {
        let result = await dataLoader.prepareTarget();
        const {folders, errors} = await dataLoader.walk();
        let {items, collections} = dataLoader.buildIndex({folders});
        const index = await dataLoader.installTheData({collections, items});
        const content = fs.readdirSync(`${usbMountPoint}/html/repository`);
        const installationTargetFolder = `${usbMountPoint}/html`;
        index.items.forEach(item => {
            item.images.forEach(image => {
                if (image.path)
                    expect(
                        statFile(`${installationTargetFolder}/${image.path}`)
                    ).to.be.true;
            });
            item.audio.forEach(file => {
                if (file.path)
                    expect(statFile(`${installationTargetFolder}/${file.path}`))
                        .to.be.true;
            });
            item.video.forEach(file => {
                if (file.path)
                    expect(statFile(`${installationTargetFolder}/${file.path}`))
                        .to.be.true;
            });
            item.transcriptions.forEach(file => {
                expect(statFile(`${installationTargetFolder}/${file.path}`)).to
                    .be.true;
            });
            item.documents.forEach(d => {
                expect(statFile(`${installationTargetFolder}/${d.url}`)).to.be
                    .true;
            });
        });
        expect(statFile(`${installationTargetFolder}/repository/index.json`)).to
            .be.true;
    }).timeout(10000);
});

function statFile(file) {
    return fs.statSync(file).isFile();
}
