import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
const REGION = "us-east-1";
// Uncomment below for local dev
// const ddbClient = new DynamoDBClient({ 
//     region: REGION,
//     accessKeyId: "123456789",
//     secretAccessKeyId: "123456789",
//     endpoint: "http://localhost:8000"
//      });

const ddbClient = new DynamoDBClient({ 
    region: REGION,
    
    });


export { ddbClient };
