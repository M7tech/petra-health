import {
  IsOptional,
  IsString,
  Length,
  IsIn,
  IsNumber,
  IsDateString,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import type { Gender } from '@petra/shared';

export class UpdateProfileRequest {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @Length(3, 30)
  phone?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsIn(['MALE', 'FEMALE', 'UNSPECIFIED'])
  gender?: Gender;

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(260)
  heightCm?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  chronicConditions?: string[];

  @IsOptional()
  @IsString()
  @Length(0, 300)
  otherConditions?: string;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(500)
  currentWeightKg?: number;

  @IsOptional()
  @IsString()
  countryId?: string;

  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;
}
