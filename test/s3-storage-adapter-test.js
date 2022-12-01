import { storageRegistry } from '@balena/sbvr-types/out/storage-adapters';
import {
	s3StorageAdapter,
	S3_STORAGE_ADAPTER_NAME,
} from '../src/s3-storage-adapter/s3-storage-adapter';
import { setupS3Mock } from './s3mocks';

// FIXME: document this test. This is a basic S3 client test

const hex = '62616C656E6142414C454E41';
const buf = Buffer.from(hex, 'hex');
const filename = 'logo.png';

beforeEach(() => {
	setupS3Mock(buf);
	// Create the engine
	console.log('Registering S3StorageAdapter');
	const adapter = s3StorageAdapter();
	storageRegistry[adapter.name] = adapter;
	console.log('S3StorageAdapter registered, adapters are: ', storageRegistry);
});

describe('S3StorageAdapter', () => {
	it('should put an object', async () => {
		const adapter = storageRegistry[S3_STORAGE_ADAPTER_NAME];
		const webresource = await adapter.saveFile(filename, buf);
		console.log(webresource);
	});

	it('should put + get an object', async () => {
		const adapter = storageRegistry[S3_STORAGE_ADAPTER_NAME];
		const webresource = await adapter.saveFile(filename, buf);
		console.log(webresource);

		const data = await adapter.getFileData(webresource);
		console.log(data);
	});
});
