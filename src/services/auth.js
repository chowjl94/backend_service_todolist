//business logic tend to be in services
// and route handling to be in routes

// this file will contain authentication logic


//import jwt for auth
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

//impor User Data model
const User = require('../models/model-users')

//salt rounds for ppl with similar password
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS)
const JWT_SECRET = process.env.JWT_SECRET
// defined own expiry time in .env
const JWT_EXPIRY = parseInt(process.env.JWT_EXPIRY)

// this function is being exproted and it returns a service object
module.exports = (db) => {
  // instantiate service obj
  const service = {}



  // genertate token function takes in a unique id and 
  service.generateToken = (user_id) => {
    // jwt.sign(payload=>{uid}, secret=>JWT_SECRET, options=>{expiresIn:JWT_EXPIRY})
    return jwt.sign({ user_id }, JWT_SECRET, { expiresIn: JWT_EXPIRY })
  }

  service.registerUser = async (username,name, password) => {
    const user = await db.findUserByUsername(username)
    if (user) {
      return null
    } else {
      //cryptographic function to return a haashed password, bcrypt to provide salt rounds
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
      //create a new User data model instance with a hashed password we never store unhased password in DBs
      const newUser = new User({ username, name, password_hash: passwordHash })
      //inserts the user into the database
      const user = await db.insertUser(newUser)
      //then we generate a new token for the user and return the token
      return service.generateToken(user.user_id)
    }
  }

  service.loginUser = async (username, password) => {
    const user = await db.findUserByUsername(username)
    if (user) {
      const isValid = await bcrypt.compare(password, user.password_hash)
      if (isValid) {
        console.log(user.user_id)
        return service.generateToken(user.user_id)
      }
    }
    return null
  }

  service.verifyToken = (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      return decoded.user_id
    } catch (err) {
      return null
    }
  }

  return service
}