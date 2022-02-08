const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const router = new express.Router()

// get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, { userName: 1 })
    res.status(200).send({ users })
  } catch (err) {
    res.status(400).send(err)
  }
})

// signup
router.post('/signup', async (req, res) => {
  const userInfoKeys = Object.keys(req.body)
  const allowedKeys = ['firstName', 'lastName', 'userName', 'email', 'password']
  const isValidOperation = userInfoKeys.every(userInfoKey =>
    allowedKeys.includes(userInfoKey)
  )
  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid create user operation!' })
  }
  const signupInfo = req.body
  signupInfo.USD = 1000
  signupInfo.GBP = 0
  signupInfo.EUR = 0
  const user = new User(signupInfo)
  try {
    await user.save()
    const token = await user.generateAuthToken()
    res.status(201).send({ user, token })
  } catch (err) {
    res.status(400).send(err)
  }
})

// login
router.post('/login', async (req, res) => {
  const userInfoKeys = Object.keys(req.body)
  const allowedKeys = ['userName', 'email', 'password']
  const isValidOperation = userInfoKeys.every(userInfoKey =>
    allowedKeys.includes(userInfoKey)
  )
  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid login operation!' })
  }
  try {
    const user = await User.findByCredentials(req.body)
    const token = await user.generateAuthToken()
    res.status(200).send({ user, token })
  } catch (err) {
    res.status(400).send(err)
  }
})

// get logged in user info
router.get('/user/info', auth, async (req, res) => {
  res.send(req.user)
})

// logout
router.post('/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => {
      return token.token !== req.token
    })
    await req.user.save()
    res.send()
  } catch (err) {
    res.status(500).send()
  }
})

// logout all
router.post('/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = []
    await req.user.save()
    res.send()
  } catch (err) {
    res.status(500).send()
  }
})

router.delete('/user', auth, async (req, res) => {
  try {
    await req.user.remove()
    res.send(req.user)
  } catch (err) {
    res.status(500).send(err)
  }
})

module.exports = router
