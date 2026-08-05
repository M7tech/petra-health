import { IsBoolean, IsNumber, IsOptional, IsString, Length, Max, Min, MinLength } from 'class-validator';

export class ResolveLocationRequest {
  @IsString() @MinLength(8) url!: string;
}

export class CreatePharmacyRequest {
  @IsString() @Length(2, 150) name!: string;
  @IsOptional() @IsString() @Length(0, 30) phone?: string;
  @IsOptional() @IsString() @Length(0, 250) address?: string;
  @IsNumber() @Min(-90) @Max(90) latitude!: number;
  @IsNumber() @Min(-180) @Max(180) longitude!: number;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class UpdatePharmacyRequest {
  @IsOptional() @IsString() @Length(2, 150) name?: string;
  @IsOptional() @IsString() @Length(0, 30) phone?: string;
  @IsOptional() @IsString() @Length(0, 250) address?: string;
  @IsOptional() @IsNumber() @Min(-90) @Max(90) latitude?: number;
  @IsOptional() @IsNumber() @Min(-180) @Max(180) longitude?: number;
  @IsOptional() @IsBoolean() active?: boolean;
}
