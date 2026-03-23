/** DTOs for the Feature Flags domain (mirrors NestJS PropertyFeatureFlagResponseDto). */
export interface PropertyFeatureFlagDto {
  propertyId: string;
  featureFlagId: string;
  key: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}
