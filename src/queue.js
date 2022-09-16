/* eslint-disable no-console */
const amqp = require('amqp-connection-manager');
const reportError = require('../sentry');
const { env } = require('../config');

let logDisconnectError = true;

const scanQueue = env.AMQP_SCAN_QUEUE;

const conn = amqp.connect([env.AMQP_URI], { heartbeatIntervalInSeconds: 45 });
conn.on('connect', () => {
  console.log('Queue: connected!');
  logDisconnectError = true;
});
conn.on('disconnect', ({ err }) => {
  if (logDisconnectError) {
    console.warn('Queue: disconnected!');
    reportError(err);
    logDisconnectError = false;
  }
});

const channelWrapper = conn.createChannel({
  json: true,
  setup: channel => {
    console.log('Queue: executing channel setup');
    return channel.assertQueue(scanQueue, {
      maxPriority: env.AMQP_QUEUE_MAX_PIORITY,
      durable: env.AMQP_QUEUE_DURABLE,
      messageTtl: env.AMQP_QUEUE_MESSAGE_TTL,
      deadLetterExchange: `${env.AMQP_DEAD_LETTER_SCAN_QUEUE}-exchange`,
      deadLetterRoutingKey: `${env.AMQP_DEAD_LETTER_SCAN_QUEUE}-key`
    });
  }
});

// This is just to give us some more insights of what happened
channelWrapper.on('connect', () => console.log('Queue: channel connected'));
channelWrapper.on('error', (err, { name }) => console.error('Queue: channel error', err, name));
channelWrapper.on('close', () => console.warn('Queue: channel closed'));

const sendToRabbitQueue = async (payload, priority) => {
  const content = {
    ...payload,
    name: 'generate-and-save-report',
    isMonorepoSupported: env.MONOREPO_NEW_APPROACH_ENABLED
  };
  const options = { priority, persistent: true };
  try {
    await channelWrapper.sendToQueue(scanQueue, content, options);
  } catch (e) {
    channelWrapper.close();
    conn.close();
    throw new Error('Queue: message was rejected', e.message);
  }
};

module.exports = {
  sendToRabbitQueue
};
