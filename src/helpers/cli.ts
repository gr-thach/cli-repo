import minioClient from '../services/minio';

export const getUploadUrl = async (key: string) => {
  return minioClient.getUploadUrl(key);
};
