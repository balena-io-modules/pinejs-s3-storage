import { s3StorageAdapter } from './s3-storage-adapter/s3-storage-adapter';
import { storageRegistry } from '@balena/sbvr-types/out/storage-adapters';
export { s3StorageAdapter } from './s3-storage-adapter/s3-storage-adapter';

export function initS3Storage() {
	console.log('Registering S3StorageAdapter');
	const adapter = s3StorageAdapter();
	storageRegistry[adapter.name] = adapter;
	console.log(
		'S3StorageAdapter registered, adapters are: ',
		Object.keys(storageRegistry),
	);
}
