import { IsString, IsOptional, Length, Matches } from 'class-validator';

export class UpsertCountryRequest {
  @IsString()
  @Length(2, 80)
  name!: string;

  @IsString()
  @Matches(/^[A-Z]{2}$/, { message: 'isoCode must be a 2-letter uppercase code' })
  isoCode!: string;
}

export class UpsertCityRequest {
  @IsString()
  @Length(1, 80)
  name!: string;

  @IsString()
  countryId!: string;
}

export class UpsertDoctorRequest {
  @IsString()
  @Length(2, 120)
  fullName!: string;

  @IsOptional()
  @IsString()
  @Length(0, 120)
  specialty?: string;

  @IsOptional()
  @IsString()
  @Length(0, 40)
  phone?: string;

  @IsString()
  cityId!: string;

  @IsString()
  countryId!: string;
}
