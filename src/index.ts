import { s3StorageAdapter } from './s3-storage-adapter/s3-storage-adapter';
export { s3StorageAdapter } from './s3-storage-adapter/s3-storage-adapter';
import { registerStorageAdapter } from '@balena/sbvr-types/out/storage-adapters';

export function initS3Storage() {
	console.log('Registering S3StorageAdapter');
	const adapter = s3StorageAdapter();
	registerStorageAdapter(adapter.name, adapter);

	console.log('S3StorageAdapter registered');
}
