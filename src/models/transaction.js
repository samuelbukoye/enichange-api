const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema(
  {
    credit: {
      type: Boolean,
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    senderUserName: {
      type: String,
      required: true,
      trim: true
    },
    receiverUserName: {
      type: String,
      required: true,
      trim: true
    },
    sendAmount: {
      type: Number,
      required: true
    },
    receiveAmount: {
      type: Number,
      required: true
    },
    sendCurrency: {
      type: String,
      required: true,
      enum: ['USD', 'GBP', 'EUR'],
      trim: true
    },
    receiveCurrency: {
      type: String,
      required: true,
      enum: ['USD', 'GBP', 'EUR']
    },
    exchangeRate: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
)

transactionSchema.statics.findExchangeRate = (
  sendCurrency,
  receiveCurrency
) => {
  if (sendCurrency === 'GBP' && receiveCurrency === 'USD') return 1.35
  if (sendCurrency === 'GBP' && receiveCurrency === 'EUR') return 1.18
  if (sendCurrency === 'GBP' && receiveCurrency === 'GBP') return 1
  if (sendCurrency === 'USD' && receiveCurrency === 'USD') return 1
  if (sendCurrency === 'USD' && receiveCurrency === 'EUR') return 0.87
  if (sendCurrency === 'USD' && receiveCurrency === 'GBP') return 0.74
  if (sendCurrency === 'EUR' && receiveCurrency === 'USD') return 1.15
  if (sendCurrency === 'EUR' && receiveCurrency === 'EUR') return 1
  if (sendCurrency === 'EUR' && receiveCurrency === 'GBP') return 0.85
}

const Transaction = mongoose.model('Transaction', transactionSchema)

module.exports = Transaction
