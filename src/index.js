const express = require('express')
require('./db/mongoose')
const cors = require('cors')
const UserRouter = require('./routers/user')
const TransactionRouter = require('./routers/transaction')

const app = express()
const port = process.env.PORT

app.use(express.json())
app.use(cors())
app.use(UserRouter)
app.use(TransactionRouter)

app.get('*', (req, res) => {
  res.status(404).end('not a valid endpoint')
})

app.listen(port, () => {
  console.log('server is listening on port ', port)
})
