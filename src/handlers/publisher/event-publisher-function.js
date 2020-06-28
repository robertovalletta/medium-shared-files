/**
 * A Lambda function that logs the payload received from SNS.
 */

const AWS = require('aws-sdk')
const sns = new AWS.SNS({apiVersion: '2010-03-31'})

const joi = require('@hapi/joi')
    .extend(require('@hapi/joi-date'));

const schema = joi.object({
    event: joi
        .string()
        .alphanum()
        .min(3)
        .max(50)
        .required(),
    timestamp: joi
        .date()
        .format("DD-MM-YYYY HH:mm:ss")
        .required()
})

exports.publisherFunction = async (event, context) => {
    try {
        console.log(`event received from API: ${JSON.stringify(event)}`)

        const body = JSON.parse(event.body)

        let {value, error} = schema.validate(body)

        if (error) {
            console.log(`Found validation error: ${JSON.stringify(error)}`)
            return {statusCode: 400, body: JSON.stringify(error)}
        }

        const snsBody = JSON.stringify(value);

        const params = {
            Message: snsBody,
            Subject: body.event,
            TopicArn: process.env.Topic
        }

        console.log(`publishing: ${JSON.stringify(params)}`)

        let result = await sns.publish(params)
            .promise();
        console.log(`published: ${JSON.stringify(result)}`)

        return {
            'statusCode': 202,
            'body': snsBody
        }
    } catch (e) {
        console.error(`Error in publishing message`, e)
        return {
            'statusCode': 500,
            'body': JSON.stringify(e)
        }
    }
}
