import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateProfileRequest {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  fullName?: string;

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
