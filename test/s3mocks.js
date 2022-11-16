import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
} from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { Readable } from 'stream';
import { sdkStreamMixin } from '@aws-sdk/util-stream-node';

// FIXME: document this setup
export function setupS3Mock(buf) {
	const s3Mock = mockClient(S3Client);
	s3Mock.on(PutObjectCommand).resolves({ ETag: '1' });
	console.log('On setupS3Mock, buf: ', buf);
	const stream = Readable.from(buf);
	// Adding the sdkStreamMixin to add extra functions to the stream to properly mock the response
	// Response format: https://github.com/aws/aws-sdk-js-v3#streams
	// mixin: https://github.com/aws/aws-sdk-js-v3/issues/1877#issuecomment-1287275227
	s3Mock.on(GetObjectCommand).resolves({ Body: sdkStreamMixin(stream) });
}
