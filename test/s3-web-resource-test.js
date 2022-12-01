const { describe } = require('./helpers');
import * as chai from 'chai';
import * as chaiDateTime from 'chai-datetime';
import * as chaiAsPromised from 'chai-as-promised';
import { setupS3Mock } from './s3mocks';

// FIXME: document this test. This is similar to WebResources but it knows it's using an S3 engine instead of the default Disk engine
const {
	S3_STORAGE_ADAPTER_NAME,
} = require('../src/s3-storage-adapter/s3-storage-adapter');

chai.use(chaiDateTime);
chai.use(chaiAsPromised);
const { expect } = chai;

const hex = '62616C656E6142414C454E41';
const buf = Buffer.from(hex, 'hex');

beforeEach(() => {
	setupS3Mock(buf);
	// Create the engine
	require('../src/index');
});

const s3ObjectSource = {
	filename: 'logo.png',
	data: buf,
	contentType: 'image/png',
	contentDisposition: null,
	size: buf.byteLength,
	storage: S3_STORAGE_ADAPTER_NAME,
};

const s3ObjectRef = {
	filename: s3ObjectSource.filename,
	href: 'http://s3.awsobject.com/bucket/object1',
	contentType: s3ObjectSource.contentType,
	contentDisposition: s3ObjectSource.contentDisposition,
	size: s3ObjectSource.size,
};

describe('WebResource', (test) => {
	describe('fetchProcessing', () => {
		test.fetch(JSON.stringify(s3ObjectRef), s3ObjectRef);
	});

	describe('validate', () => {
		test.validate(s3ObjectSource, true, (value) => {
			expect(typeof value).to.equal('string');
			const asObj = JSON.parse(value);
			expect(asObj.filename).to.equal(s3ObjectSource.filename);
			const s3UrlRE =
				/^https?:\/\/(?<bucket>.*)\.s3\.(?<region>.*)\.amazonaws\.com\/(?<key>.*)$/;
			expect(asObj.href).to.match(s3UrlRE);
		});
	});
});
