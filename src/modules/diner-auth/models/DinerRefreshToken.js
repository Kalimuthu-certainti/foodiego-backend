const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');
const Diner = require('./Diner');

const DinerRefreshToken = sequelize.define('DinerRefreshToken', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  diner_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'diners', key: 'id' },
    onDelete: 'CASCADE',
  },
  token_hash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
  },
  device_info: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  revoked_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: 'diner_refresh_tokens',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

DinerRefreshToken.belongsTo(Diner, { foreignKey: 'diner_id' });
Diner.hasMany(DinerRefreshToken, { foreignKey: 'diner_id' });

module.exports = DinerRefreshToken;
