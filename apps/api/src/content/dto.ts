import { IsArray, IsIn, IsOptional, IsString, IsUrl, Length } from 'class-validator';

const CONTENT_TYPES = ['NEWS', 'TRAINING'];

export class CreateContentRequest {
  @IsIn(CONTENT_TYPES)
  type!: 'NEWS' | 'TRAINING';

  @IsString()
  @Length(1, 200)
  titleEn!: string;

  @IsOptional() @IsString() @Length(0, 200) titleAr?: string;
  @IsOptional() @IsString() @Length(0, 200) titleKu?: string;

  @IsOptional() @IsString() @Length(0, 5000) bodyEn?: string;
  @IsOptional() @IsString() @Length(0, 5000) bodyAr?: string;
  @IsOptional() @IsString() @Length(0, 5000) bodyKu?: string;

  @IsOptional() @IsUrl() videoUrlEn?: string;
  @IsOptional() @IsUrl() videoUrlAr?: string;
  @IsOptional() @IsUrl() videoUrlKu?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  photoUrls?: string[];
}

export class UpdateContentRequest {
  @IsOptional() @IsIn(CONTENT_TYPES) type?: 'NEWS' | 'TRAINING';

  @IsOptional() @IsString() @Length(1, 200) titleEn?: string;
  @IsOptional() @IsString() @Length(0, 200) titleAr?: string;
  @IsOptional() @IsString() @Length(0, 200) titleKu?: string;

  @IsOptional() @IsString() @Length(0, 5000) bodyEn?: string;
  @IsOptional() @IsString() @Length(0, 5000) bodyAr?: string;
  @IsOptional() @IsString() @Length(0, 5000) bodyKu?: string;

  @IsOptional() @IsUrl() videoUrlEn?: string;
  @IsOptional() @IsUrl() videoUrlAr?: string;
  @IsOptional() @IsUrl() videoUrlKu?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  photoUrls?: string[];
}
