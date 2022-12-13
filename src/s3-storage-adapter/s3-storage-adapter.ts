import {
	S3Client,
	S3ClientConfig,
	GetObjectCommand,
	DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import {
	StorageAdapter,
	FileRef,
} from '@balena/sbvr-types/out/storage-adapters';
import { Upload } from '@aws-sdk/lib-storage';

export const S3_STORAGE_ADAPTER_NAME = 'S3';

const S3_STORAGE_ADAPTER_DEFAULT_BUCKET = 'balena-pine-web-resources';
const S3_STORAGE_ADAPTER_DEFAULT_REGION = 'us-east-1';

const generateUniqueKey = (filename: string) => {
	const prefix = filename;
	const random = uuidv4();
	return `${prefix}_${random}`;
};

interface S3StorageAdapter extends StorageAdapter {
	s3Client: S3Client;
	config: S3ClientConfig;
	bucket: string;
}

export const s3StorageAdapter = (): S3StorageAdapter => {
	const config: S3ClientConfig = {
		region:
			process.env.S3_STORAGE_ADAPTER_REGION ||
			S3_STORAGE_ADAPTER_DEFAULT_REGION,
	};

	if (process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY) {
		config.credentials = {
			accessKeyId: process.env.S3_ACCESS_KEY,
			secretAccessKey: process.env.S3_SECRET_KEY,
		};
	}
	if (process.env.S3_ENDPOINT) {
		config.endpoint = process.env.S3_ENDPOINT;
		config.forcePathStyle = true;
	}
	let s3UploadQueueSize: number;
	if (process.env.S3_UPLOAD_QUEUE_SIZE) {
		s3UploadQueueSize = parseInt(process.env.S3_UPLOAD_QUEUE_SIZE, 10);
		if (Number.isNaN(s3UploadQueueSize) || s3UploadQueueSize <= 0) {
			throw new Error(
				`Invalid valid for S3_UPLOAD_QUEUE_SIZE: ${process.env.S3_UPLOAD_QUEUE_SIZE}`,
			);
		}
	} else {
		s3UploadQueueSize = 6;
	}

	let s3UploadPartSize: number;
	if (process.env.S3_UPLOAD_PART_SIZE) {
		s3UploadPartSize = parseInt(process.env.S3_UPLOAD_PART_SIZE, 10);
		if (Number.isNaN(s3UploadPartSize) || s3UploadPartSize <= 0) {
			throw new Error(
				`Invalid valid for S3_UPLOAD_PART_SIZE: ${process.env.S3_UPLOAD_PART_SIZE}`,
			);
		}
	} else {
		s3UploadPartSize = 1024 * 1024 * 100;
	}

	const bucket =
		process.env.S3_STORAGE_ADAPTER_BUCKET || S3_STORAGE_ADAPTER_DEFAULT_BUCKET;

	const s3Client = new S3Client(config);

	const adapter: S3StorageAdapter = {
		config,
		bucket,
		name: S3_STORAGE_ADAPTER_NAME,
		s3Client,

		saveFile: async (filename: string, data: Buffer): Promise<FileRef> => {
			const key = generateUniqueKey(filename);
			const uploadParams = {
				Bucket: bucket,
				Key: key,
				Body: data,
			};

			try {
				const parallelUploads3 = new Upload({
					client: s3Client,
					params: uploadParams,
					queueSize: s3UploadQueueSize, // optional concurrency configuration
					partSize: s3UploadPartSize, // optional size of each part, in bytes, at least 5MB
					leavePartsOnError: false, // optional manually handle dropped parts
				});

				await parallelUploads3.done();
				let s3ObjectUrl: string;
				if (config.endpoint) {
					s3ObjectUrl = `${config.endpoint}/${uploadParams.Bucket}/${uploadParams.Key}`;
				} else {
					s3ObjectUrl = `https://${uploadParams.Bucket}.s3.${config.region}.amazonaws.com/${uploadParams.Key}`;
				}

				const webresource: FileRef = {
					storage: S3_STORAGE_ADAPTER_NAME,
					filename,
					href: s3ObjectUrl,
				};

				return webresource;
			} catch (err) {
				console.log('Error when saving to S3', err);
				throw err;
			}
		},

		getFileData: async (webresource: FileRef): Promise<Buffer> => {
			const commandInput = getCommandInput(webresource, config);

			try {
				const commandOutput = await s3Client.send(
					new GetObjectCommand(commandInput),
				);
				// For a description of the response format, which is a Stream with a mixin, see https://github.com/aws/aws-sdk-js-v3#streams
				if (!commandOutput.Body?.transformToByteArray) {
					throw new Error(
						'Invalid response to GetObjectCommand: response does not implement transformToByteArray',
					);
				}
				const byteArray = await commandOutput.Body?.transformToByteArray();
				if (!byteArray) {
					throw new Error('Empty content');
				}
				const bufferMethod1 = Buffer.from(byteArray);
				return bufferMethod1;
			} catch (err) {
				console.log('Error when retrieving object from S3', err);
				throw err;
			}
		},

		deleteFile: async (webresource: FileRef): Promise<void> => {
			const commandInput = getCommandInput(webresource, config);

			try {
				await s3Client.send(new DeleteObjectCommand(commandInput));
			} catch (err) {
				console.log('Error when deleting object from S3', err);
				throw err;
			}
		},
	};

	return adapter;
};

function getCommandInput(webresource: FileRef, config: S3ClientConfig) {
	let s3UrlRE: RegExp;
	if (config.endpoint) {
		s3UrlRE = new RegExp(`^${config.endpoint}\/(?<bucket>.*)\/(?<key>.*)$`);
	} else {
		s3UrlRE =
			/^https?:\/\/(?<bucket>.*)\.s3\.(?<region>.*)\.amazonaws\.com\/(?<key>.*)$/;
	}

	const match = s3UrlRE.exec(webresource.href);
	if (!match || !match.groups) {
		throw new Error(
			`Could not extract the bucket, key and region from: ${webresource.href}`,
		);
	}
	const commandInput = {
		Bucket: match.groups.bucket,
		Key: match.groups.key,
	};
	return commandInput;
}
