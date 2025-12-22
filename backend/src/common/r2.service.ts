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
  }

  async uploadFile(file: MulterFile, folder = 'uploads'): Promise<string> {
    const ext = file.originalname.split('.').pop();
    const key = `${folder}/${uuidv4()}.${ext}`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );
    return `${this.endpoint}/${this.bucket}/${key}`;
  }
}
