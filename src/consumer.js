require('dotenv').config()
const amqplib = require('amqplib')
const AccessService = require('./services/access')
const db = require('./db')


const URL = process.env.CLOUDAMQP_URL || 'amqp://localhost:5672'

const service = AccessService(db)


async function consume() {
  const client = await amqplib.connect(URL)
  const channel = await client.createChannel()
  await channel.assertQueue(process.env.QUEUE)
  channel.consume(process.env.QUEUE, (msg) => {
      const data = JSON.parse(msg.content)
      
  
      service.addAccess(data)
      .then(()=>{          
      console.log("ACKNOWLEDGED")
      channel.ack(msg)
    })
      .catch((err) => {
      console.log(err)
      channel.nack(msg)
  })

  })

}

consume()





