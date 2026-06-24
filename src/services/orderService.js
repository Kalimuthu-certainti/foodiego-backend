const { Order, OrderItem, Restaurant } = require('../models');

const getReorderRestaurants = async (dinerId) => {
  const recentOrders = await Order.findAll({
    where: { dinerId, status: 'delivered' },
    include: [
      { model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'imageUrl', 'cuisineTags'] },
      { model: OrderItem, as: 'items', attributes: ['name', 'qty', 'price'] },
    ],
    order: [['created_at', 'DESC']],
    limit: 3,
  });

  return recentOrders.map((order) => ({
    id: order.restaurant.id,
    name: order.restaurant.name,
    imageUrl: order.restaurant.imageUrl,
    cuisineTags: order.restaurant.cuisineTags,
    lastOrderDate: order.createdAt,
    lastOrderItems: order.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
  }));
};

module.exports = { getReorderRestaurants };
