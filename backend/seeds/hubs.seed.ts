/**
 * Hubs Seed - Initial hub data for logistics system
 * Creates physical packing stations and fulfillment centers
 */

import { Hub, IHub } from '../models/hubs.model';

export async function seedHubs(): Promise<IHub[]> {
  const hubsData = [
    {
      name: 'Eschweiler Central Hub',
      address: {
        street: 'Hauptstraße 123',
        city: 'Eschweiler',
        state: 'North Rhine-Westphalia',
        postalCode: '52249'
      },
      operatingHours: '9:00 AM - 6:00 PM',
      isActive: true
    },
    {
      name: 'Aachen West Hub',
      address: {
        street: 'Weststraße 456',
        city: 'Aachen',
        state: 'North Rhine-Westphalia',
        postalCode: '52062'
      },
      operatingHours: '8:00 AM - 7:00 PM',
      isActive: true
    },
    {
      name: 'Düren South Hub',
      address: {
        street: 'Südstraße 789',
        city: 'Düren',
        state: 'North Rhine-Westphalia',
        postalCode: '52349'
      },
      operatingHours: '9:00 AM - 5:30 PM',
      isActive: true
    },
    {
      name: 'Jülich East Hub',
      address: {
        street: 'Oststraße 321',
        city: 'Jülich',
        state: 'North Rhine-Westphalia',
        postalCode: '52428'
      },
      operatingHours: '8:30 AM - 6:30 PM',
      isActive: true
    },
    {
      name: 'Heinsberg North Hub',
      address: {
        street: 'Nordstraße 654',
        city: 'Heinsberg',
        state: 'North Rhine-Westphalia',
        postalCode: '52525'
      },
      operatingHours: '9:00 AM - 5:00 PM',
      isActive: false // Inactive hub for testing
    }
  ];

  try {
    // Clear existing hubs
    await Hub.deleteMany({});
    console.log('Cleared existing hubs');

    // Create new hubs
    const hubs = await Hub.insertMany(hubsData);
    console.log(`Created ${hubs.length} hubs`);

    return hubs;
  } catch (error) {
    console.error('Error seeding hubs:', error);
    throw error;
  }
} 