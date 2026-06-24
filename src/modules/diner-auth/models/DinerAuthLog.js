const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const DinerAuthLog = sequelize.define('DinerAuthLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  diner_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // NULL for failed pre-auth attempts
    references: { model: 'diners', key: 'id' },
    onDelete: 'SET NULL',
  },
  phone: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  event_type: {
    type: DataTypes.ENUM(
      'LOGIN_SUCCESS',
      'LOGIN_FAILED',
      'REGISTER_SUCCESS',
      'OTP_SENT',
      'OTP_FAILED',
      'LOGOUT',
      'TOKEN_REFRESH',
      'TOKEN_REUSE_DETECTED',
      'ACCOUNT_LOCKED'
    ),
    allowNull: false,
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  tableName: 'diner_auth_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['diner_id'] },
    { fields: ['created_at'] },
  ],
});

module.exports = DinerAuthLog;
