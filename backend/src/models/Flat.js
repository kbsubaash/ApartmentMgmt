const mongoose = require('mongoose');

const flatSchema = new mongoose.Schema(
  {
    block: {
      type: String,
      required: true,
      default: '1A',
      trim: true,
    },
    unitNumber: {
      type: Number,
      required: [true, 'Unit number is required'],
      min: 1,
      max: 19,
    },
    type: {
      type: String,
      enum: ['1BHK', '2BHK', '3BHK', 'Other'],
      default: '2BHK',
    },
    ownershipType: {
      type: String,
      enum: ['Owner', 'Tenant'],
      default: 'Owner',
    },
    assignedMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['occupied', 'vacant'],
      default: 'vacant',
    },
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

flatSchema.virtual('displayId').get(function () {
  return `${this.block}-${this.unitNumber}`;
});

flatSchema.index({ block: 1, unitNumber: 1 }, { unique: true });

module.exports = mongoose.model('Flat', flatSchema);
