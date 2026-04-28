import { PropertyType } from './listing';

export type ListingFilters = {
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  propertyType?: PropertyType | '';
  furnished?: boolean;
};
