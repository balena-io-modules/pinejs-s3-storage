import { S3StorageAdapter } from './s3-storage-adapter/S3StorageAdapter';
import { storageRegistry } from '@balena/sbvr-types/out/storage-adapters';

console.debug('Registering S3StorageAdapter');
const s3StorageAdapter = new S3StorageAdapter();
storageRegistry[s3StorageAdapter.name] = s3StorageAdapter;
console.debug('S3StorageAdapter registered, adapters are: ', storageRegistry);
