import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DirectoryService } from './directory.service';
import { UpsertCityRequest, UpsertCountryRequest, UpsertDoctorRequest } from './dto';
import { AdminGuard, JwtAuthGuard } from '../auth/guards';

@Controller('directory')
export class DirectoryController {
  constructor(private readonly directory: DirectoryService) {}

  // ---- Public reads: power the hierarchical onboarding dropdowns ----
  @Get('countries')
  countries() {
    return this.directory.listCountries();
  }

  @Get('cities')
  cities(@Query('countryId') countryId?: string) {
    return this.directory.listCities(countryId);
  }

  @Get('doctors')
  doctors(@Query('cityId') cityId?: string, @Query('countryId') countryId?: string) {
    return this.directory.listDoctors({ cityId, countryId });
  }

  // ---- Admin CRUD (JWT + admin role) ----
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('countries')
  createCountry(@Body() dto: UpsertCountryRequest) {
    return this.directory.createCountry(dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('countries/:id')
  updateCountry(@Param('id') id: string, @Body() dto: UpsertCountryRequest) {
    return this.directory.updateCountry(id, dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('countries/:id')
  deleteCountry(@Param('id') id: string) {
    return this.directory.deleteCountry(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('cities')
  createCity(@Body() dto: UpsertCityRequest) {
    return this.directory.createCity(dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('cities/:id')
  updateCity(@Param('id') id: string, @Body() dto: UpsertCityRequest) {
    return this.directory.updateCity(id, dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('cities/:id')
  deleteCity(@Param('id') id: string) {
    return this.directory.deleteCity(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('doctors')
  createDoctor(@Body() dto: UpsertDoctorRequest) {
    return this.directory.createDoctor(dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('doctors/:id')
  updateDoctor(@Param('id') id: string, @Body() dto: UpsertDoctorRequest) {
    return this.directory.updateDoctor(id, dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('doctors/:id')
  deleteDoctor(@Param('id') id: string) {
    return this.directory.deleteDoctor(id);
  }
}
