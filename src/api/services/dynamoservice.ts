import { DynamoDBClient, PutItemCommand, GetItemCommand, ScanCommand, DeleteItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';


// Initialize DynamoDB client
const dynamo = new DynamoDBClient({ region: 'us-east-2' });

export interface Module {
    id: string;
    name: string;
    version: string;
    s3Key: string;
}
export interface PackageMetadata {
    Name: string;
    Version: string;
    ID: string;
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
        TableName: 'Packages', // Replace with your actual DynamoDB table name
        Key: {
            id: { S: id },
        },
    });

    try {
        const response = await dynamo.send(command);

        if (!response.Item) {
            console.error('Package not found in DynamoDB.');
            return null; // Return null if the item doesn't exist
        }

        // Safely access attributes and provide default values if missing
        return {
            id: response.Item.id?.S || null,
            name: response.Item.name?.S || null,
            version: response.Item.version?.S || null,
            s3Key: response.Item.s3Key?.S || null,
            packageUrl: response.Item.packageUrl?.S || null,
        };
    } catch (error) {
        console.error('Error fetching package from DynamoDB:', error);
        throw error; // Re-throw the error for higher-level handling
    }
};
export const getPackagesFromDynamoDB = async (
    queries: Module[],
    offset: string = '0',
    limit: number = 10
) => {
    // Convert offset to an integer and set a default value if it's invalid
    const startIndex = parseInt(offset, 10) || 0;
    const pageSize = limit;

    // Construct filter expressions for the DynamoDB scan query
    const filterExpressions = queries
        .map((query, idx) => {
            return `#name${idx} = :name${idx} AND #version${idx} = :version${idx}`;
        })
        .join(' OR ');

    // Dynamically create the expression attribute values and names
    let expressionValues: { [key: string]: { S: string } } = {};
    let expressionNames: { [key: string]: string } = {};

    queries.forEach((query, idx) => {
        expressionValues[`:name${idx}`] = { S: query.name };
        expressionValues[`:version${idx}`] = { S: query.version };
        expressionNames[`#name${idx}`] = 'name';
        expressionNames[`#version${idx}`] = 'version';
    });

    // Command to scan DynamoDB
    const command = new ScanCommand({
        TableName: 'Packages',
        FilterExpression: filterExpressions,
        ExpressionAttributeValues: expressionValues,
        ExpressionAttributeNames: expressionNames,
        ExclusiveStartKey: startIndex ? { id: { S: startIndex.toString() } } : undefined,
    });

    try {
        const response = await dynamo.send(command);

        if (!response.Items || response.Items.length === 0) {
            return { packages: [], nextOffset: '' };
        }

        // Paginate the results by slicing the array to the page size
        const paginatedPackages = response.Items.slice(startIndex, startIndex + pageSize);

        // Set the next offset for pagination (this would be the id of the last item in the page)
        const nextOffset =
            paginatedPackages.length < pageSize ? '' : (startIndex + pageSize).toString();

        // Map the results to match the expected format
        const packages = paginatedPackages.map((pkg) => ({
            id: pkg.id.S,
            name: pkg.name.S,
            version: pkg.version.S,
            s3Key: pkg.s3Key.S,
        }));

        return {
            packages,
            nextOffset,
        };
    } catch (error: unknown) {
        // Type narrowing for error
        if (error instanceof Error) {
            console.error('Error scanning packages from DynamoDB:', error.message);
        } else {
            console.error('Unknown error scanning packages:', error);
        }
        throw error;
    }
};
// Clear all entries in the Packages table
export const clearRegistryInDynamoDB = async () => {
    const scanCommand = new ScanCommand({
        TableName: 'Packages',
    });

    try {
        // Fetch all items from the Packages table
        const scanResponse = await dynamo.send(scanCommand);
        if (!scanResponse.Items) return;

        // Delete each item individually
        const deletePromises = scanResponse.Items.map((item) => {
            const deleteCommand = new DeleteItemCommand({
                TableName: 'Packages',
                Key: {
                    id: item.id,
                },
            });
            return dynamo.send(deleteCommand);
        });

        await Promise.all(deletePromises);
        console.log('Registry has been cleared in DynamoDB.');
    } catch (error) {
        console.error('Error clearing registry in DynamoDB:', error);
        throw error;
    }
};


// Function to add data to DynamoDB
export const updateDynamoPackagedata = async (
    metadata: PackageMetadata): Promise<string | null> => {
    // The table name should match your DynamoDB table's name
    const tableName = 'Packages';

    // Create the PutItemCommand with metadata and rating
    const command = new PutItemCommand({
        TableName: tableName,
        Item: {
            id: { S: metadata.ID },  // ID as string
            name: { S: metadata.Name },  // Name as string
            version: { S: metadata.Version },  // Version as string
        },
    });

    try {
        // Send the command to DynamoDB to insert the item
        await dynamo.send(command);
        console.log('Package metadata added to DynamoDB:', metadata);

        // Return the package ID
        return metadata.ID;
    } catch (error) {
        console.error('Error adding package to DynamoDB:', error);
        return null;
    }
};