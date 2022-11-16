import { S3StorageAdapter } from '../src/s3-storage-adapter/S3StorageAdapter';
import { setupS3Mock } from './s3mocks';

// FIXME: document this test. This is a basic S3 client test

const hex = '62616C656E6142414C454E41';
const buf = Buffer.from(hex, 'hex');
const filename = 'logo.png';

beforeEach(() => {
	setupS3Mock(buf);
	// Create the engine
	require('../src/index');
});

describe('S3StorageAdapter', () => {
	it('should put an object', async () => {
		const adapter = new S3StorageAdapter();
		const webresource = await adapter.saveFile(filename, buf);
		console.log(webresource);
	});

	it('should put + get an object', async () => {
		const adapter = new S3StorageAdapter();
		const webresource = await adapter.saveFile(filename, buf);
		console.log(webresource);

		const data = await adapter.getFileData(webresource);
		console.log(data);
	});
});
