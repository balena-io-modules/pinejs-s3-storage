import {
	S3Client,
	S3ClientConfig,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import * as uuidv4 from 'uuidv4';
import {
	StorageAdapter,
	FileRef,
} from '@balena/sbvr-types/out/storage-adapters';

export const S3_STORAGE_ADAPTER_NAME = 'S3';

const S3_STORAGE_ADAPTER_DEFAULT_BUCKET = 'balena-pine-web-resources';
const S3_STORAGE_ADAPTER_DEFAULT_REGION = 'us-east-1';

const generateUniqueKey = (filename: string) => {
	const prefix = filename;
	const random = uuidv4.uuid();
	return `${prefix}_${random}`;
};

/**
 * FIXME upload objects using "Upload". See https://github.com/m-radzikowski/aws-sdk-client-mock#lib-storage-upload
 */
export class S3StorageAdapter implements StorageAdapter {
	s3Client: S3Client;
	config: S3ClientConfig;
	bucket: string;
	name: string;

	constructor() {
		this.name = S3_STORAGE_ADAPTER_NAME;
		this.config = {
			region:
				process.env.S3_STORAGE_ADAPTER_REGION ||
				S3_STORAGE_ADAPTER_DEFAULT_REGION,
		};
		if (process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY) {
			this.config.credentials = {
				accessKeyId: process.env.S3_ACCESS_KEY,
				secretAccessKey: process.env.S3_SECRET_KEY,
			};
		}
		if (process.env.S3_ENDPOINT) {
			this.config.endpoint = process.env.S3_ENDPOINT;
			this.config.forcePathStyle = true;
		}
		console.log('Creating S3Client with config:', this.config);
		this.s3Client = new S3Client(this.config);
		this.bucket =
			process.env.S3_STORAGE_ADAPTER_BUCKET ||
			S3_STORAGE_ADAPTER_DEFAULT_BUCKET;
	}

	async saveFile(filename: string, data: Buffer): Promise<FileRef> {
		const key = generateUniqueKey(filename);
		const uploadParams = {
			Bucket: this.bucket,
			Key: key,
			Body: data,
		};

		try {
			console.log(
				'About to send PutObjectCommand with uploadParams:',
				uploadParams,
			);
			const commandOutput = await this.s3Client.send(
				new PutObjectCommand(uploadParams),
			);
			console.log('Success', commandOutput);

			const s3ObjectUrl = `https://${uploadParams.Bucket}.s3.${this.config.region}.amazonaws.com/${uploadParams.Key}`;

			const webresource: FileRef = {
				storage: S3_STORAGE_ADAPTER_NAME,
				filename,
				href: s3ObjectUrl,
			};

			return webresource;
		} catch (err) {
			console.log('Error', err);
			throw err;
		}
	}

	async getFileData(webresource: FileRef): Promise<Buffer> {
		const commandInput = this.getCommandInput(webresource);

		try {
			const commandOutput = await this.s3Client.send(
				new GetObjectCommand(commandInput),
			);
			// For a description of the response format, which is a Stream with a mixin, see https://github.com/aws/aws-sdk-js-v3#streams
			console.log('GetObjectCommand commandOutput: ', commandOutput);
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
			console.log('Error', err);
			throw err;
		}
	}

	async deleteFile(webresource: FileRef): Promise<void> {
		const commandInput = this.getCommandInput(webresource);

		try {
			const commandOutput = await this.s3Client.send(
				new DeleteObjectCommand(commandInput),
			);
			console.log(commandOutput.$metadata.httpStatusCode);
		} catch (err) {
			console.log('Error', err);
			throw err;
		}
	}

	private getCommandInput(webresource: FileRef) {
		const s3UrlRE =
			/^https?:\/\/(?<bucket>.*)\.s3\.(?<region>.*)\.amazonaws\.com\/(?<key>.*)$/;
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
		console.log(commandInput);
		return commandInput;
	}
}
