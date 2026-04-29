export type PropertyType = 'House' | 'Apartment' | 'Room';

export type Listing = {
  id: string;
  ownerId?: string;
  title: string;
  description?: string;
  photoPaths?: string[];
  priceUgx: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: PropertyType;
  furnished: boolean;
  district: string;
  address: string;
  latitude: number;
  longitude: number;
};
