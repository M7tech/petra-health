import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';

// E.164-ish: leading + and 6-15 digits.
const WHATSAPP_PATTERN = /^\+\d{6,15}$/;
import { UsersService } from './users.service';
import { JwtAuthGuard, SuperAdminGuard } from '../auth/guards';

class CreateManagerRequest {
  @IsString() @Length(3, 40) username!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) @MaxLength(72) password!: string;
  @IsString() @Length(2, 120) fullName!: string;
  @IsOptional() @IsString() @Length(0, 120) officeName?: string;
  @IsOptional() @Matches(WHATSAPP_PATTERN, { message: 'whatsappPhone must be E.164, e.g. +9647500000000' }) whatsappPhone?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) cityIds?: string[];
}

class UpdateManagerRequest {
  @IsOptional() @IsString() @Length(2, 120) fullName?: string;
  @IsOptional() @IsString() @Length(0, 120) officeName?: string;
  @IsOptional() @Matches(WHATSAPP_PATTERN, { message: 'whatsappPhone must be E.164, e.g. +9647500000000' }) whatsappPhone?: string;
  @IsOptional() @IsString() @MinLength(8) @MaxLength(72) password?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) cityIds?: string[];
}

@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin/users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list() {
    return this.users.list();
  }

  @Post()
  create(@Body() dto: CreateManagerRequest) {
    return this.users.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateManagerRequest) {
    return this.users.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.users.remove(id);
  }
}
