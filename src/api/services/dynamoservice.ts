import { DynamoDBClient, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';

// Initialize DynamoDB client
const dynamo = new DynamoDBClient({ region: 'us-east-2' });

interface Module {
    id: string;
    name: string;
    version: string;
    s3Key: string;
}

export const addModuleToDynamoDB = async (module: Module) => {
    const command = new PutItemCommand({
        TableName: 'Packages',
        Item: {
            id: { S: module.id },
            name: { S: module.name },
            version: { S: module.version },
            s3Key: { S: module.s3Key },
        },
    });

    try {
        await dynamo.send(command);
        console.log('Module metadata added to DynamoDB:', module);
    } catch (error) {
        console.error('Error adding module to DynamoDB:', error);
        throw error;
    }
};

export const getPackageFromDynamoDB = async (id: string) => {
    const command = new GetItemCommand({
        TableName: 'Modules',
        Key: {
            id: { S: id }
        }
    });

    try {
        const response = await dynamo.send(command);
        if (!response.Item) return null;

        return {
            id: response.Item.id.S,
            name: response.Item.name.S,
            version: response.Item.version.S,
            s3Key: response.Item.s3Key.S
        };
    } catch (error) {
        console.error('Error fetching package from DynamoDB:', error);
        throw error;
    }
};
