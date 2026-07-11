import { IsOptional, IsString, IsNumber, IsIn, Length, Min, Max } from 'class-validator';
import type { TreatmentStatus } from '@petra/shared';

const STATUSES = ['ONGOING', 'COMPLETED', 'DISCONTINUED'];

export class UpsertAssessmentRequest {
  @IsOptional() @IsString() @Length(0, 60) diabetesDuration?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(20) baselineHba1c?: number;
  @IsOptional() @IsString() @Length(0, 60) startingDose?: string;
  @IsOptional() @IsString() @Length(0, 500) concomitantMeds?: string;
  @IsOptional() @IsIn(STATUSES) treatmentStatus?: TreatmentStatus;
  @IsOptional() @IsString() @Length(0, 500) discontinuationReason?: string;
  @IsOptional() @IsString() @Length(0, 1000) physicianComments?: string;
}

export class CreateCommentRequest {
  @IsString() @Length(1, 1000) body!: string;
  @IsOptional() @IsString() weightEntryId?: string;
}
