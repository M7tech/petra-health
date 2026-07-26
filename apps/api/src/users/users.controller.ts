import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MinLength,
  MaxLength,
} from 'class-validator';
import { UsersService } from './users.service';
import { JwtAuthGuard, SuperAdminGuard } from '../auth/guards';

class CreateManagerRequest {
  @IsString() @Length(3, 40) username!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) @MaxLength(72) password!: string;
  @IsString() @Length(2, 120) fullName!: string;
  @IsOptional() @IsString() @Length(0, 120) officeName?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) doctorIds?: string[];
}

class UpdateManagerRequest {
  @IsOptional() @IsString() @Length(2, 120) fullName?: string;
  @IsOptional() @IsString() @Length(0, 120) officeName?: string;
  @IsOptional() @IsString() @MinLength(8) @MaxLength(72) password?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) doctorIds?: string[];
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
