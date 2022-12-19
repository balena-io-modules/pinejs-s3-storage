# pinejs-s3-storage

`S3StorageAdapter` is an implementation of a [PineJS WebResource storage adapter](https://github.com/balena-io-modules/sbvr-types/blob/master/src/storage-adapters/storage-adapter.ts#L7) that saves objects to Amazon S3 or a compatible service like [MinIO](https://github.com/minio/minio)

The configuration is specified as environment variables

|ENV var|Default Value  |Description
:---|:---|:---
|S3_STORAGE_ADAPTER_REGION | us-east-1                 | |
|S3_STORAGE_ADAPTER_BUCKET | balena-pine-web-resources | |
|S3_ACCESS_KEY | no default | |
|S3_SECRET_KEY | no default | |
|S3_ENDPOINT | no default| The fully qualified endpoint of the webservice. This is only required when using a custom endpoint (for example, when using a local version of S3|
|S3_UPLOAD_QUEUE_SIZE| 6 | How many parts to upload in parallel |
|S3_UPLOAD_PART_SIZE| 100MB | Size of each part, min 5MB|


Applications need to load the `˜S3StorageAdapter` in the `storageRegistry`(./src/storage-adapters/index.ts#L4), which can be done by calling [`initS3Storage()`](./src/index.ts#L5)
