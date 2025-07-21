/**
 * Delivery Runs Seed - Sample delivery run data
 * Creates example delivery runs for testing the logistics system
 */

import { DeliveryRun, IDeliveryRun, DeliveryRunStatus, StopType, StopStatus } from '../models/deliveryRuns.model';
import { User } from '../models/users.model';
import { Hub } from '../models/hubs.model';
import { Order } from '../models/orders.model';

export async function seedDeliveryRuns(users: any[], hubs: any[], orders: any[]): Promise<IDeliveryRun[]> {
  // Get delivery agents
  const deliveryAgents = users.filter(user => user.role === 'delivery_agent');
  
  if (deliveryAgents.length === 0) {
    console.log('No delivery agents found, skipping delivery runs seed');
    return [];
  }

  if (hubs.length === 0) {
    console.log('No hubs found, skipping delivery runs seed');
    return [];
  }

  if (orders.length === 0) {
    console.log('No orders found, skipping delivery runs seed');
    return [];
  }

  const deliveryRunsData = [
    {
      deliveryAgentId: deliveryAgents[0]._id,
      assignedHubId: hubs[0]._id, // Eschweiler Central Hub
      status: DeliveryRunStatus.COMPLETED,
      orders: [orders[0]._id, orders[1]._id],
      routePlan: [
        {
          stopType: StopType.PICKUP,
          location: {
            address: 'Vendor Address 1, Eschweiler, NRW 52249'
          },
          relatedDocument: {
            modelName: 'Vendor' as const,
            docId: '507f1f77bcf86cd799439011' // Mock vendor ID
          },
          status: StopStatus.COMPLETED,
          actualTime: new Date(Date.now() - 86400000) // 1 day ago
        },
        {
          stopType: StopType.HUB,
          location: {
            address: hubs[0].address.street + ', ' + hubs[0].address.city + ', ' + hubs[0].address.state + ' ' + hubs[0].address.postalCode
          },
          relatedDocument: {
            modelName: 'Hub' as const,
            docId: hubs[0]._id
          },
          status: StopStatus.COMPLETED,
          actualTime: new Date(Date.now() - 82800000) // 23 hours ago
        },
        {
          stopType: StopType.DROPOFF,
          location: {
            address: 'Customer Address 1, Eschweiler, NRW 52249'
          },
          relatedDocument: {
            modelName: 'Order' as const,
            docId: orders[0]._id
          },
          status: StopStatus.COMPLETED,
          actualTime: new Date(Date.now() - 79200000) // 22 hours ago
        },
        {
          stopType: StopType.DROPOFF,
          location: {
            address: 'Customer Address 2, Eschweiler, NRW 52249'
          },
          relatedDocument: {
            modelName: 'Order',
            docId: orders[1]._id
          },
          status: StopStatus.COMPLETED,
          actualTime: new Date(Date.now() - 75600000) // 21 hours ago
        }
      ],
      estimatedStartTime: new Date(Date.now() - 86400000),
      actualStartTime: new Date(Date.now() - 86400000),
      estimatedCompletionTime: new Date(Date.now() - 75600000),
      actualCompletionTime: new Date(Date.now() - 75600000)
    },
    {
      deliveryAgentId: deliveryAgents[0]._id,
      assignedHubId: hubs[1]._id, // Aachen West Hub
      status: DeliveryRunStatus.OUT_FOR_DELIVERY,
      orders: [orders[2]._id],
      routePlan: [
        {
          stopType: StopType.PICKUP,
          location: {
            address: 'Vendor Address 2, Aachen, NRW 52062'
          },
          relatedDocument: {
            modelName: 'Vendor',
            docId: '507f1f77bcf86cd799439012' // Mock vendor ID
          },
          status: StopStatus.COMPLETED,
          actualTime: new Date(Date.now() - 3600000) // 1 hour ago
        },
        {
          stopType: StopType.HUB,
          location: {
            address: hubs[1].address.street + ', ' + hubs[1].address.city + ', ' + hubs[1].address.state + ' ' + hubs[1].address.postalCode
          },
          relatedDocument: {
            modelName: 'Hub',
            docId: hubs[1]._id
          },
          status: StopStatus.COMPLETED,
          actualTime: new Date(Date.now() - 1800000) // 30 minutes ago
        },
        {
          stopType: StopType.DROPOFF,
          location: {
            address: 'Customer Address 3, Aachen, NRW 52062'
          },
          relatedDocument: {
            modelName: 'Order',
            docId: orders[2]._id
          },
          status: StopStatus.PENDING
        }
      ],
      estimatedStartTime: new Date(Date.now() - 3600000),
      actualStartTime: new Date(Date.now() - 3600000),
      estimatedCompletionTime: new Date(Date.now() + 1800000) // 30 minutes from now
    },
    {
      deliveryAgentId: deliveryAgents[0]._id,
      assignedHubId: hubs[2]._id, // Düren South Hub
      status: DeliveryRunStatus.PLANNING,
      orders: [orders[3]._id, orders[4]._id],
      routePlan: [
        {
          stopType: StopType.PICKUP,
          location: {
            address: 'Vendor Address 3, Düren, NRW 52349'
          },
          relatedDocument: {
            modelName: 'Vendor',
            docId: '507f1f77bcf86cd799439013' // Mock vendor ID
          },
          status: StopStatus.PENDING
        },
        {
          stopType: StopType.HUB,
          location: {
            address: hubs[2].address.street + ', ' + hubs[2].address.city + ', ' + hubs[2].address.state + ' ' + hubs[2].address.postalCode
          },
          relatedDocument: {
            modelName: 'Hub',
            docId: hubs[2]._id
          },
          status: StopStatus.PENDING
        },
        {
          stopType: StopType.DROPOFF,
          location: {
            address: 'Customer Address 4, Düren, NRW 52349'
          },
          relatedDocument: {
            modelName: 'Order',
            docId: orders[3]._id
          },
          status: StopStatus.PENDING
        },
        {
          stopType: StopType.DROPOFF,
          location: {
            address: 'Customer Address 5, Düren, NRW 52349'
          },
          relatedDocument: {
            modelName: 'Order',
            docId: orders[4]._id
          },
          status: StopStatus.PENDING
        }
      ],
      estimatedStartTime: new Date(Date.now() + 3600000), // 1 hour from now
      estimatedCompletionTime: new Date(Date.now() + 7200000) // 2 hours from now
    }
  ];

  try {
    // Clear existing delivery runs
    await DeliveryRun.deleteMany({});
    console.log('Cleared existing delivery runs');

    // Create new delivery runs
    const deliveryRuns = await DeliveryRun.insertMany(deliveryRunsData) as any;
    console.log(`Created ${deliveryRuns.length} delivery runs`);

    // Update orders to link them to delivery runs
    for (const run of deliveryRuns) {
      await Order.updateMany(
        { _id: { $in: run.orders } },
        { 
          deliveryRunId: run._id,
          orderStatus: run.status === DeliveryRunStatus.COMPLETED ? 'delivered' : 
                     run.status === DeliveryRunStatus.OUT_FOR_DELIVERY ? 'out_for_delivery' :
                     'awaiting_delivery_run'
        }
      );
    }

    return deliveryRuns;
  } catch (error) {
    console.error('Error seeding delivery runs:', error);
    throw error;
  }
} 