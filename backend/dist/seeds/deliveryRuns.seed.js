"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDeliveryRuns = seedDeliveryRuns;
const deliveryRuns_model_1 = require("../models/deliveryRuns.model");
const orders_model_1 = require("../models/orders.model");
async function seedDeliveryRuns(users, hubs, orders) {
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
            assignedHubId: hubs[0]._id,
            status: deliveryRuns_model_1.DeliveryRunStatus.COMPLETED,
            orders: [orders[0]._id, orders[1]._id],
            routePlan: [
                {
                    stopType: deliveryRuns_model_1.StopType.PICKUP,
                    location: {
                        address: 'Vendor Address 1, Eschweiler, NRW 52249'
                    },
                    relatedDocument: {
                        modelName: 'Vendor',
                        docId: '507f1f77bcf86cd799439011'
                    },
                    status: deliveryRuns_model_1.StopStatus.COMPLETED,
                    actualTime: new Date(Date.now() - 86400000)
                },
                {
                    stopType: deliveryRuns_model_1.StopType.HUB,
                    location: {
                        address: hubs[0].address.street + ', ' + hubs[0].address.city + ', ' + hubs[0].address.state + ' ' + hubs[0].address.postalCode
                    },
                    relatedDocument: {
                        modelName: 'Hub',
                        docId: hubs[0]._id
                    },
                    status: deliveryRuns_model_1.StopStatus.COMPLETED,
                    actualTime: new Date(Date.now() - 82800000)
                },
                {
                    stopType: deliveryRuns_model_1.StopType.DROPOFF,
                    location: {
                        address: 'Customer Address 1, Eschweiler, NRW 52249'
                    },
                    relatedDocument: {
                        modelName: 'Order',
                        docId: orders[0]._id
                    },
                    status: deliveryRuns_model_1.StopStatus.COMPLETED,
                    actualTime: new Date(Date.now() - 79200000)
                },
                {
                    stopType: deliveryRuns_model_1.StopType.DROPOFF,
                    location: {
                        address: 'Customer Address 2, Eschweiler, NRW 52249'
                    },
                    relatedDocument: {
                        modelName: 'Order',
                        docId: orders[1]._id
                    },
                    status: deliveryRuns_model_1.StopStatus.COMPLETED,
                    actualTime: new Date(Date.now() - 75600000)
                }
            ],
            estimatedStartTime: new Date(Date.now() - 86400000),
            actualStartTime: new Date(Date.now() - 86400000),
            estimatedCompletionTime: new Date(Date.now() - 75600000),
            actualCompletionTime: new Date(Date.now() - 75600000)
        },
        {
            deliveryAgentId: deliveryAgents[0]._id,
            assignedHubId: hubs[1]._id,
            status: deliveryRuns_model_1.DeliveryRunStatus.OUT_FOR_DELIVERY,
            orders: [orders[2]._id],
            routePlan: [
                {
                    stopType: deliveryRuns_model_1.StopType.PICKUP,
                    location: {
                        address: 'Vendor Address 2, Aachen, NRW 52062'
                    },
                    relatedDocument: {
                        modelName: 'Vendor',
                        docId: '507f1f77bcf86cd799439012'
                    },
                    status: deliveryRuns_model_1.StopStatus.COMPLETED,
                    actualTime: new Date(Date.now() - 3600000)
                },
                {
                    stopType: deliveryRuns_model_1.StopType.HUB,
                    location: {
                        address: hubs[1].address.street + ', ' + hubs[1].address.city + ', ' + hubs[1].address.state + ' ' + hubs[1].address.postalCode
                    },
                    relatedDocument: {
                        modelName: 'Hub',
                        docId: hubs[1]._id
                    },
                    status: deliveryRuns_model_1.StopStatus.COMPLETED,
                    actualTime: new Date(Date.now() - 1800000)
                },
                {
                    stopType: deliveryRuns_model_1.StopType.DROPOFF,
                    location: {
                        address: 'Customer Address 3, Aachen, NRW 52062'
                    },
                    relatedDocument: {
                        modelName: 'Order',
                        docId: orders[2]._id
                    },
                    status: deliveryRuns_model_1.StopStatus.PENDING
                }
            ],
            estimatedStartTime: new Date(Date.now() - 3600000),
            actualStartTime: new Date(Date.now() - 3600000),
            estimatedCompletionTime: new Date(Date.now() + 1800000)
        },
        {
            deliveryAgentId: deliveryAgents[0]._id,
            assignedHubId: hubs[2]._id,
            status: deliveryRuns_model_1.DeliveryRunStatus.PLANNING,
            orders: [orders[3]._id, orders[4]._id],
            routePlan: [
                {
                    stopType: deliveryRuns_model_1.StopType.PICKUP,
                    location: {
                        address: 'Vendor Address 3, Düren, NRW 52349'
                    },
                    relatedDocument: {
                        modelName: 'Vendor',
                        docId: '507f1f77bcf86cd799439013'
                    },
                    status: deliveryRuns_model_1.StopStatus.PENDING
                },
                {
                    stopType: deliveryRuns_model_1.StopType.HUB,
                    location: {
                        address: hubs[2].address.street + ', ' + hubs[2].address.city + ', ' + hubs[2].address.state + ' ' + hubs[2].address.postalCode
                    },
                    relatedDocument: {
                        modelName: 'Hub',
                        docId: hubs[2]._id
                    },
                    status: deliveryRuns_model_1.StopStatus.PENDING
                },
                {
                    stopType: deliveryRuns_model_1.StopType.DROPOFF,
                    location: {
                        address: 'Customer Address 4, Düren, NRW 52349'
                    },
                    relatedDocument: {
                        modelName: 'Order',
                        docId: orders[3]._id
                    },
                    status: deliveryRuns_model_1.StopStatus.PENDING
                },
                {
                    stopType: deliveryRuns_model_1.StopType.DROPOFF,
                    location: {
                        address: 'Customer Address 5, Düren, NRW 52349'
                    },
                    relatedDocument: {
                        modelName: 'Order',
                        docId: orders[4]._id
                    },
                    status: deliveryRuns_model_1.StopStatus.PENDING
                }
            ],
            estimatedStartTime: new Date(Date.now() + 3600000),
            estimatedCompletionTime: new Date(Date.now() + 7200000)
        }
    ];
    try {
        await deliveryRuns_model_1.DeliveryRun.deleteMany({});
        console.log('Cleared existing delivery runs');
        const deliveryRuns = await deliveryRuns_model_1.DeliveryRun.insertMany(deliveryRunsData);
        console.log(`Created ${deliveryRuns.length} delivery runs`);
        for (const run of deliveryRuns) {
            await orders_model_1.Order.updateMany({ _id: { $in: run.orders } }, {
                deliveryRunId: run._id,
                orderStatus: run.status === deliveryRuns_model_1.DeliveryRunStatus.COMPLETED ? 'delivered' :
                    run.status === deliveryRuns_model_1.DeliveryRunStatus.OUT_FOR_DELIVERY ? 'out_for_delivery' :
                        'awaiting_delivery_run'
            });
        }
        return deliveryRuns;
    }
    catch (error) {
        console.error('Error seeding delivery runs:', error);
        throw error;
    }
}
//# sourceMappingURL=deliveryRuns.seed.js.map