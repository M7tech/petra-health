import { IsOptional, IsString, IsNumber, IsDateString, Length, Min } from 'class-validator';

export class EnrollMedicationRequest {
  @IsOptional()
  @IsString()
  medicationId?: string; // link to catalog (e.g. Semetra); optional for custom meds

  @IsString()
  @Length(1, 120)
  name!: string;

  @IsOptional()
  @IsString()
  dosage?: string;

  @IsOptional()
  @IsString()
  frequency?: string;

  @IsOptional()
  @IsString()
  timeOfDay?: string; // "HH:mm"

  @IsOptional()
  @IsDateString()
  startDate?: string;
}

export class LogDoseRequest {
  @IsString()
  userMedicationId!: string;

  @IsDateString()
  scheduledFor!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  doseMg?: number;

  @IsOptional()
  @IsString()
  @Length(0, 280)
  note?: string;
}
