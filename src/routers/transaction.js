const express = require('express')
const Transaction = require('../models/transaction')
const User = require('../models/user')
const auth = require('../middleware/auth')
const router = new express.Router()

router.post('/getRateAndPrice', auth, async (req, res) => {
  try {
    const transactionInfoKeys = Object.keys(req.body)
    const allowedKeys = ['sendCurrency', 'receiveCurrency', 'sendAmount']

    const isValidOperation = transactionInfoKeys.every(transactionInfoKey =>
      allowedKeys.includes(transactionInfoKey)
    )
    if (!isValidOperation) {
      return res
        .status(400)
        .send({ error: 'Invalid create transaction operation!' })
    }

    const { sendCurrency, receiveCurrency, sendAmount } = req.body

    if (
      !(
        (sendCurrency === 'GBP' ||
          sendCurrency === 'USD' ||
          sendCurrency === 'EUR') &&
        (receiveCurrency === 'GBP' ||
          receiveCurrency === 'USD' ||
          receiveCurrency === 'EUR')
      )
    ) {
      return res
        .status(400)
        .send({ error: 'Invalid create transaction operation!' })
    }

    const exchangeRate = Transaction.findExchangeRate(
      sendCurrency,
      receiveCurrency
    )
    const receiveAmount = exchangeRate * sendAmount
    res.status(200).send({ exchangeRate, receiveAmount })
  } catch (err) {
    res.status(400).send(err)
  }
})

router.post('/transaction', auth, async (req, res) => {
  const transactionInfoKeys = Object.keys(req.body)
  const allowedKeys = [
    'receiverUserName',
    'sendAmount',
    'sendCurrency',
    'receiveCurrency'
  ]
  const isValidOperation = transactionInfoKeys.every(transactionInfoKey =>
    allowedKeys.includes(transactionInfoKey)
  )
  if (!isValidOperation) {
    return res
      .status(400)
      .send({ error: 'Invalid create transaction operation!' })
  }

  const {
    sendCurrency,
    receiveCurrency,
    sendAmount,
    receiverUserName
  } = req.body

  if (sendAmount < 5) {
    return res.status(400).send({
      error: `You can only send a minimun amount of 5 ${sendCurrency}`
    })
  }

  if (sendAmount > req.user[sendCurrency]) {
    return res.status(400).send({
      error: `You cannot send more than your ${sendCurrency} balance of ${req.user[sendCurrency]}`
    })
  }

  if (
    !(
      (sendCurrency === 'GBP' ||
        sendCurrency === 'USD' ||
        sendCurrency === 'EUR') &&
      (receiveCurrency === 'GBP' ||
        receiveCurrency === 'USD' ||
        receiveCurrency === 'EUR')
    )
  ) {
    return res
      .status(400)
      .send({ error: 'Invalid create transaction operation!' })
  }

  const receiver = await User.findUserByUsername(receiverUserName)

  if (!receiver) {
    return res.status(400).send('UserName Not Found')
  }
  if (
    req.user.userName === receiver.userName &&
    sendCurrency === receiveCurrency
  ) {
    return res
      .status(400)
      .send(
        'Cannot send into same currency accounts belonging to the same user'
      )
  }
  const exchangeRate = Transaction.findExchangeRate(
    sendCurrency,
    receiveCurrency
  )

  try {
    const receiveAmount = exchangeRate * sendAmount
    const receiverBalance = receiver[receiveCurrency] + receiveAmount
    receiver[receiveCurrency] = receiverBalance

    const senderBalance = req.user[sendCurrency] - sendAmount
    req.user[sendCurrency] = senderBalance
    if (req.user.userName === receiver.userName) {
      req.user[receiveCurrency] = receiverBalance
    }

    const senderTransactionInfo = {
      credit: false,
      userId: req.user.id,
      senderUserName: req.user.userName,
      ...req.body,
      receiveAmount,
      exchangeRate
    }

    const receiverTransactionInfo = {
      credit: true,
      userId: receiver._id,
      senderUserName: req.user.userName,
      receiverUserName: receiver.userName,
      sendAmount,
      receiveAmount,
      sendCurrency,
      receiveCurrency,
      exchangeRate
    }

    const senderTransaction = new Transaction(senderTransactionInfo)
    const receiverTransaction = new Transaction(receiverTransactionInfo)
    await receiver.save()
    await req.user.save()
    await receiverTransaction.save()
    await senderTransaction.save()
    res.status(201).send({ user: req.user, transaction: senderTransaction })
  } catch (err) {
    res.status(400).send(err)
  }
})

router.get('/transactions', auth, async (req, res) => {
  try {
    await req.user.populate({
      path: 'transactions'
    })
    res.send(req.user.transactions)
  } catch (err) {
    res.status(500).send(err)
  }
})

module.exports = router
