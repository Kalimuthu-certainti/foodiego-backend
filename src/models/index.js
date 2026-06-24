const { sequelize } = require('../config/db');
const { DataTypes } = require('sequelize');

const Banner = sequelize.define('Banner', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  imageUrl: { type: DataTypes.TEXT, allowNull: false, field: 'image_url' },
  linkUrl: { type: DataTypes.TEXT, field: 'link_url' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  displayOrder: { type: DataTypes.INTEGER, defaultValue: 0, field: 'display_order' },
  startDate: { type: DataTypes.DATEONLY, field: 'start_date' },
  endDate: { type: DataTypes.DATEONLY, field: 'end_date' },
}, { tableName: 'banners', underscored: true });

const Cuisine = sequelize.define('Cuisine', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  slug: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  iconUrl: { type: DataTypes.TEXT, field: 'icon_url' },
  displayOrder: { type: DataTypes.INTEGER, defaultValue: 0, field: 'display_order' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
}, { tableName: 'cuisines', underscored: true });

const Restaurant = sequelize.define('Restaurant', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  brandId: { type: DataTypes.UUID, field: 'brand_id' },
  name: { type: DataTypes.STRING(200), allowNull: false },
  slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
  cuisineTags: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [], field: 'cuisine_tags' },
  rating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0.00 },
  minOrder: { type: DataTypes.INTEGER, defaultValue: 0, field: 'min_order' },
  deliveryTime: { type: DataTypes.STRING(20), defaultValue: 'Coming Soon', field: 'delivery_time' },
  imageUrl: { type: DataTypes.TEXT, field: 'image_url' },
  isVeg: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_veg' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  isClosed: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_closed' },
  closedUntil: { type: DataTypes.TIME, field: 'closed_until' },
  lat: { type: DataTypes.DECIMAL(9, 6), allowNull: false },
  lng: { type: DataTypes.DECIMAL(9, 6), allowNull: false },
}, { tableName: 'restaurants', underscored: true });

const RestaurantOffer = sequelize.define('RestaurantOffer', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  restaurantId: { type: DataTypes.UUID, allowNull: false, field: 'restaurant_id' },
  offerText: { type: DataTypes.STRING(200), allowNull: false, field: 'offer_text' },
  offerCode: { type: DataTypes.STRING(50), field: 'offer_code' },
  minOrder: { type: DataTypes.INTEGER, defaultValue: 0, field: 'min_order' },
  maxDiscount: { type: DataTypes.INTEGER, field: 'max_discount' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  startDate: { type: DataTypes.DATE, field: 'start_date' },
  endDate: { type: DataTypes.DATE, field: 'end_date' },
}, { tableName: 'restaurant_offers', underscored: true });

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  phone: { type: DataTypes.STRING(15), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(100) },
  role: {
    type: DataTypes.ENUM('DINER','PLATFORM_ADMIN','RESTAURANT_OWNER','RESTAURANT_MANAGER','MENU_MANAGER','RESTAURANT_SUPPORT_STAFF','RESTAURANT_OPERATOR'),
    defaultValue: 'DINER',
  },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  lastLogin: { type: DataTypes.DATE, field: 'last_login' },
}, { tableName: 'users', underscored: true });

const Order = sequelize.define('Order', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  dinerId: { type: DataTypes.UUID, allowNull: false, field: 'diner_id' },
  restaurantId: { type: DataTypes.UUID, allowNull: false, field: 'restaurant_id' },
  status: {
    type: DataTypes.ENUM('placed','confirmed','preparing','out_for_delivery','delivered','cancelled'),
    defaultValue: 'placed',
  },
  totalAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'total_amount' },
  paymentMethod: {
    type: DataTypes.ENUM('razorpay_upi','razorpay_card','razorpay_wallet','cod'),
    field: 'payment_method',
  },
}, { tableName: 'orders', underscored: true });

const OrderItem = sequelize.define('OrderItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  orderId: { type: DataTypes.UUID, allowNull: false, field: 'order_id' },
  menuItemId: { type: DataTypes.UUID, allowNull: false, field: 'menu_item_id' },
  name: { type: DataTypes.STRING(200), allowNull: false },
  qty: { type: DataTypes.INTEGER, defaultValue: 1 },
  price: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
}, { tableName: 'order_items', underscored: true });

Restaurant.hasMany(RestaurantOffer, { foreignKey: 'restaurant_id', as: 'offers' });
RestaurantOffer.belongsTo(Restaurant, { foreignKey: 'restaurant_id' });
User.hasMany(Order, { foreignKey: 'diner_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'diner_id' });
Order.belongsTo(Restaurant, { foreignKey: 'restaurant_id', as: 'restaurant' });
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

module.exports = { sequelize, Banner, Cuisine, Restaurant, RestaurantOffer, User, Order, OrderItem };
