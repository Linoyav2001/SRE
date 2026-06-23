const { Kafka } = require('kafkajs');
const log4js = require('log4js');

log4js.configure({
    appenders: { console: { type: 'stdout', layout: { type: 'pattern', pattern: '%m' } } },
    categories: { default: { appenders: ['console'], level: 'info' } }
});
const logger = log4js.getLogger();

const kafka = new Kafka({
    clientId: 'helfy-sre-consumer',
    brokers: [process.env.KAFKA_BROKER || 'kafka:9092']
});

const topic = process.env.KAFKA_TOPIC || 'dbserver1.login_app.users';
const consumer = kafka.consumer({ groupId: 'cdc-group' });

const run = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: topic, fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            try {
                if (!message.value) return;

                const value = message.value.toString();
                const parsedValue = JSON.parse(value);

                const payload = parsedValue.payload || {};
                const op = payload.op;

                const data = payload.after || payload.before;

                logger.info(JSON.stringify({
                    timestamp: new Date().toISOString(),
                    source: 'DEBEZIUM_CDC',
                    operation: op,
                    table: payload.source ? payload.source.table : 'unknown',
                    data: data
                }));
            } catch (error) {
                logger.error(JSON.stringify({
                    error: 'Message processing failed',
                    details: error.message,
                    rawData: message.value ? message.value.toString() : 'null'
                }));
            }
        },
    });
};

run().catch(console.error);

const gracefulShutdown = async () => {
    try {
        await consumer.disconnect();
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);