import json
import boto3
import uuid

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('waste-feedback')

def lambda_handler(event, context):
    body = json.loads(event['body'])

    item = {
        'id': str(uuid.uuid4()),
        'predictedClass': body.get('predictedClass'),
        'isCorrect': body.get('isCorrect'),
        'correctedClass': body.get('correctedClass'),
        'timestamp': body.get('timestamp')
    }

    table.put_item(Item=item)

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': '*'
        },
        'body': json.dumps({'message': 'Feedback saved'})
    }