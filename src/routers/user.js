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
  const signupInfo = req.body
  const userInfoKeys = Object.keys(signupInfo)
  const allowedKeys = ['firstName', 'lastName', 'userName', 'email', 'password']
  const isValidOperation = userInfoKeys.every(userInfoKey =>
    allowedKeys.includes(userInfoKey)
  )
  const isValidOperation2 = allowedKeys.every(allowedKey =>
    userInfoKeys.includes(allowedKey)
  )
  if (!(isValidOperation && isValidOperation2)) {
    return res.status(400).send('Invalid signup operation')
  }
  if (signupInfo.userName < 4) {
    return res.status(400).send('Username must be at least 4 characters')
  }

  try {
    const users = await User.find({}, { userName: 1, email: 1, _id: 0 })
    const usernameExists = users.some(
      user => user.userName === signupInfo.userName
    )
    if (usernameExists) {
      return res.status(400).send('Selected username is not available')
    }
    const emailExists = users.some(user => user.email === signupInfo.email)
    if (emailExists) {
      return res.status(400).send('This email is already registered')
    }

    signupInfo.USD = 1000
    signupInfo.GBP = 0
    signupInfo.EUR = 0
    const user = new User(signupInfo)
    await user.save()
    const token = await user.generateAuthToken()
    res.status(201).send({ user, token })
  } catch (err) {
    res.status(400).send(err.message)
  }
})

// login
router.post('/login', async (req, res) => {
  const userKey = req.body.email ? 'email' : 'userName'
  if (!req.body[userKey]) {
    return res.status(400).send('Invalid login operation')
  }
  if (!req.body.password) {
    return res.status(400).send('Invalid login operation')
  }
  const userInfoKeys = Object.keys(req.body)
  const allowedKeys = ['userName', 'email', 'password']
  const isValidOperation = userInfoKeys.every(userInfoKey =>
    allowedKeys.includes(userInfoKey)
  )
  if (!isValidOperation) {
    return res.status(400).send('Invalid login operation!')
  }
  const body = {
    userKey,
    userInfo: req.body[userKey],
    password: req.body.password
  }
  try {
    const user = await User.findByCredentials(body)
    const token = await user.generateAuthToken()
    res.status(200).send({ user, token })
  } catch (err) {
    res.status(400).send(err.message)
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
    res.status(500).send()
  }
})

module.exports = router
