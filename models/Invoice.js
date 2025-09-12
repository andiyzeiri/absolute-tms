const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
    required: true
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  billingAddress: {
    company: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'USA' }
  },
  lineItems: [{
    description: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  dueDate: { type: Date, required: true },
  sentDate: Date,
  paidDate: Date,
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'bank_transfer', 'check', 'cash', 'ach'],
  },
  paymentReference: String,
  notes: String,
  terms: {
    type: String,
    default: 'Net 30 days'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Auto-generate invoice number
invoiceSchema.pre('save', async function(next) {
  if (!this.isNew) return next();
  
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  const count = await this.constructor.countDocuments({
    createdAt: {
      $gte: new Date(year, new Date().getMonth(), 1),
      $lt: new Date(year, new Date().getMonth() + 1, 1)
    }
  });
  
  this.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  next();
});

// Virtual for days overdue
invoiceSchema.virtual('daysOverdue').get(function() {
  if (this.status === 'paid') return 0;
  
  const today = new Date();
  if (this.dueDate < today) {
    return Math.ceil((today - this.dueDate) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for status display
invoiceSchema.virtual('statusDisplay').get(function() {
  switch (this.status) {
    case 'overdue':
      return `Overdue (${this.daysOverdue} days)`;
    case 'sent':
      return 'Awaiting Payment';
    case 'paid':
      return `Paid on ${this.paidDate?.toLocaleDateString()}`;
    default:
      return this.status.charAt(0).toUpperCase() + this.status.slice(1);
  }
});

// Update status based on due date
invoiceSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.status === 'sent' && this.dueDate < now) {
    this.status = 'overdue';
  }
  
  next();
});

// Indexes
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ customer: 1, status: 1 });
invoiceSchema.index({ trip: 1 });
invoiceSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);