import {
	getStorageAdapter,
	registerStorageAdapter,
} from '@balena/sbvr-types/out/storage-adapters';
import {
	s3StorageAdapter,
	S3_STORAGE_ADAPTER_NAME,
} from '../src/s3-storage-adapter/s3-storage-adapter';
import { setupS3Mock } from './s3mocks';
import * as chai from 'chai';
import * as chaiDateTime from 'chai-datetime';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiDateTime);
chai.use(chaiAsPromised);
const { expect } = chai;

// FIXME: document this test. This is a basic S3 client test

const hex = '62616C656E6142414C454E41';
const buf = Buffer.from(hex, 'hex');
const filename = 'logo.png';

beforeEach(() => {
	setupS3Mock(buf);
	// Create the engine
	const adapter = s3StorageAdapter();
	registerStorageAdapter(adapter.name, adapter);
});

describe('S3StorageAdapter', () => {
	it('should put an object', async () => {
		const adapter = getStorageAdapter(S3_STORAGE_ADAPTER_NAME);
		const webresource = await adapter.saveFile(filename, buf);
		expect(webresource.filename).to.equal(filename);
		expect(webresource.storage).to.equal(S3_STORAGE_ADAPTER_NAME);
		const s3UrlRE =
			/^https?:\/\/(?<bucket>.*)\.s3\.(?<region>.*)\.amazonaws\.com\/(?<key>.*)$/;
		expect(webresource.href).to.match(s3UrlRE);
	});

	it('should put + get an object', async () => {
		const adapter = getStorageAdapter(S3_STORAGE_ADAPTER_NAME);
		const webresource = await adapter.saveFile(filename, buf);

		const data = await adapter.getFileData(webresource);
		expect(data.length).to.equal(hex.length / 2);
	});
});
