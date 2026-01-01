import { Injectable } from '@nestjs/common';
import { File as MulterFile } from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class R2Service {
  private s3: S3Client;
  private bucket: string;
  private endpoint: string;
  private publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: this.configService.get<string>('R2_ENDPOINT'),
      credentials: {
        accessKeyId: this.configService.get<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('R2_SECRET_ACCESS_KEY'),
      },
    });
    this.bucket = this.configService.get<string>('R2_BUCKET_NAME');
    this.endpoint = this.configService.get<string>('R2_ENDPOINT');
    
    // Get public URL from config
    // R2 Public Development URL format: https://pub-<hash>.r2.dev/<key>
    // R2 Custom Domain format: https://<custom-domain>/<key>
    // R2 Account ID format: https://<account-id>.r2.cloudflarestorage.com/<bucket-name>/<key>
    const publicUrl = this.configService.get<string>('R2_PUBLIC_URL');
    if (publicUrl) {
      // Ensure the URL is properly formatted
      let url = publicUrl.trim();
      // Remove trailing slash
      if (url.endsWith('/')) {
        url = url.slice(0, -1);
      }
      // Validate it's a proper URL
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        console.warn('[R2Service] R2_PUBLIC_URL should start with http:// or https://, got:', url);
      }
      this.publicUrl = url;
      console.log('[R2Service] Using public URL:', this.publicUrl);
    } else {
      // Fallback: try to extract account ID from endpoint or use default format
      // If endpoint is like https://<account-id>.r2.cloudflarestorage.com
      const accountId = this.configService.get<string>('R2_ACCOUNT_ID') || '88d5f353334b051133dbf5a76b3e81a9';
      this.publicUrl = `https://${accountId}.r2.cloudflarestorage.com`;
      console.warn('[R2Service] R2_PUBLIC_URL not set, using fallback:', this.publicUrl);
    }
  }

  async uploadFile(file: MulterFile, folder = 'uploads'): Promise<string> {
    const ext = file.originalname.split('.').pop();
    const key = `${folder}/${uuidv4()}.${ext}`;
    
    try {
      // Ensure we have the file buffer
      if (!file.buffer) {
        throw new Error('File buffer is missing. Make sure multer is configured with memoryStorage().');
      }
      
      console.log('[R2Service] Uploading file:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.buffer.length,
        key,
      });
      
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          // Note: R2 doesn't support ACLs. Make sure your bucket is configured for public access.
        })
      );
      
      // Construct public URL
      // For Public Development URL (pub-*.r2.dev): https://pub-<hash>.r2.dev/<key>
      // For Custom Domain: https://<custom-domain>/<key>
      // For Account ID format: https://<account-id>.r2.cloudflarestorage.com/<bucket-name>/<key>
      let publicUrl: string;
      if (this.publicUrl.includes('.r2.dev')) {
        // Public Development URL - bucket name is NOT in the path
        publicUrl = `${this.publicUrl}/${key}`;
      } else if (this.publicUrl.includes('r2.cloudflarestorage.com')) {
        // Account ID format - bucket name IS in the path
        publicUrl = `${this.publicUrl}/${this.bucket}/${key}`;
      } else {
        // Custom domain - bucket name is typically NOT in the path
        publicUrl = `${this.publicUrl}/${key}`;
      }
      
      console.log('[R2Service] File uploaded successfully:', {
        bucket: this.bucket,
        key,
        publicUrl,
        contentType: file.mimetype,
        publicUrlBase: this.publicUrl,
      });
      
      return publicUrl;
    } catch (error) {
      console.error('[R2Service] Error uploading file:', error);
      throw error;
    }
  }
}
