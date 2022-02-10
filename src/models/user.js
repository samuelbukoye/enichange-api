const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Transaction = require('./transaction')

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    userName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate (value) {
        if (!validator.isEmail(value)) {
          throw new Error('Please input a correct email address')
        }
      }
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: [8, 'Password must have at least 8 characters'],
      validate (value) {
        if (value.toLowerCase().includes('password')) {
          throw new Error("Password cannot include string 'password'")
        }
        const validExp = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/
        if (!validExp.test(value)) {
          throw new Error(
            'Password must have, an uppercase letter, a lowercase letter,a number, and one special character'
          )
        }
      }
    },
    EUR: {
      type: Number,
      required: true,
      validate (value) {
        if (value < 0) {
          throw new Error('EURO balance cannot be negative')
        }
      }
    },
    GBP: {
      type: Number,
      required: true,
      validate (value) {
        if (value < 0) {
          throw new Error('Pounds balance cannot be negative')
        }
      }
    },
    USD: {
      type: Number,
      required: true,
      validate (value) {
        if (value < 0) {
          throw new Error('Dollar balance cannot be negative')
        }
      }
    },
    tokens: [
      {
        token: {
          type: String,
          required: true
        }
      }
    ]
  },
  {
    timestamps: true
  }
)

userSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'userId'
})

// generate tokens
userSchema.methods.generateAuthToken = async function () {
  const user = this

  // const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, {
  const token = jwt.sign(
    { _id: user._id.toString() },
    'thisismydopeasssecret',
    {
      expiresIn: '7 days'
    }
  )

  user.tokens = user.tokens.concat({ token })
  await user.save()
  return token
}

// remove tokens and password fron sent user details
userSchema.methods.toJSON = function () {
  const user = this

  const userObject = user.toObject()

  delete userObject.password
  delete userObject.tokens
  return userObject
}

// log in
userSchema.statics.findByCredentials = async body => {
  const user = await User.findOne({ [body.userKey]: body.userInfo })
  if (!user) {
    throw new Error('User does not exist')
  }
  const isMatch = await bcrypt.compare(body.password, user.password)
  if (!isMatch) {
    throw new Error('Wrong password')
  }

  return user
}

// find by userName
userSchema.statics.findUserByUsername = async userName => {
  const user = await User.findOne({ userName })
  return user
}

// hash the plain text password before saving
userSchema.pre('save', async function (next) {
  const user = this

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8)
  }

  next()
})

// Delete user transactions when user is removed
userSchema.pre('remove', async function (next) {
  const user = this

  await Transaction.deleteMany({ userId: user._id })

  next()
})

const User = mongoose.model('User', userSchema)

module.exports = User
