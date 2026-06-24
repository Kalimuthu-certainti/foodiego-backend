const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const OtpVerification = sequelize.define('OtpVerification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  phone: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  otp_hash: {
    type: DataTypes.STRING(64), // SHA-256 hex = 64 chars
    allowNull: false,
  },
  purpose: {
    type: DataTypes.ENUM('REGISTER', 'LOGIN'),
    allowNull: false,
  },
  attempt_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  used_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: 'otp_verifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['phone', 'purpose'] },
    { fields: ['expires_at'] },
  ],
});

module.exports = OtpVerification;
