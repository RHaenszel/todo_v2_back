import { GetItemCommand, ScanCommand, PutItemCommand, DeleteItemCommand, UpdateItemCommand} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ddbClient } from "./ddbClient.js"
import { v4 as uuidv4 } from 'uuid';

export const handler = async function(event) {
    console.log("-----------------------------------------------------------")
    // console.log("request:", JSON.stringify(event.request, undefined, 2));
    console.log("body:", JSON.stringify(event.body, undefined, 2));
    console.log("headers:", JSON.stringify(event.headers, undefined, 2));
    console.log("httpMethod:", JSON.stringify(event.httpMethod, undefined, 2));
    console.log("pathParameters:", JSON.stringify(event.pathParameters, undefined, 2));

    let body;

    try {
      switch (event.httpMethod) {
        case "GET":
          if (event.pathParameters != null) {
            body = await getTodoById(event.pathParameters.todoId);
          } else {
            body = await getAllTodos();
          }
          break;
        case "POST":
          body = await createTodo(event);
          break;
        case "DELETE":
          body = await deleteTodo(event.pathParameters.todoId);
          break;
        case "PUT":
          body = await updateTodo(event);
          break;
        default:
          throw new Error(`Unsupported route: "${event.httpMethod}"`);
      }
      console.log("BODY that will be returned: ....", body);

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `Successfully finished operation: "${event.httpMethod}"`,
          body: body
        })
      };      
    } catch (e) {
      console.error(e);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Failed to perform operation.",
          errorMsg: e.message,
          errorStack: e.stack,
        })
      };
    }  
};

const getTodoById = async (todoId) => {
  console.log("getTodoById: ", todoId );
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ todoId: todoId })
    };
 
    const { Item } = await ddbClient.send(new GetItemCommand(params));

    console.log("Item not unmarshall(ed)", Item);
    console.log("Item unmarshall(ed)", (Item) ? unmarshall(Item) : {})
    return (Item) ? unmarshall(Item) : {};

  } catch (e) {
    console.error(e);
    throw e;
  }
}

const getAllTodos = async () => {
  console.log("getAllTodos");
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME
    };
 
    const { Items } = await ddbClient.send(new ScanCommand(params));    

    console.log(Items);
    return (Items) ? Items.map((item) => unmarshall(item)) : {};

  } catch(e) {
    console.error(e);
    throw e;
  }
}


const createTodo = async (event) => {
  try {
    
    const todoRequest = JSON.parse(event.body);
    // set todoID using uuidv4
    const todoId = uuidv4();
    todoRequest.todoId = todoId;

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: marshall(todoRequest || {})
    };

    const createResult = await ddbClient.send(new PutItemCommand(params));
    console.log(createResult);
    return createResult;

  } catch(e) {
    console.error(e);
    throw e;
  }
}

const deleteTodo = async (todoId) => {
  try {
    console.log(`deleteTodo function. todoId : "${todoId}"`);

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ todoId: todoId })
    };  

    const deleteResult = await ddbClient.send(new DeleteItemCommand(params));
    console.log(deleteResult);
    return deleteResult;

  } catch(e) {
    console.error(e);
    throw e;
  }
}

const updateTodo = async (event) => {
  try {
    const requestBody = JSON.parse(event.body);
    const objKeys = Object.keys(requestBody);
    console.log(`updateTodo function. requestBody : "${requestBody}", objKeys: "${objKeys}"`);

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ todoId: event.pathParameters.todoId }),
      UpdateExpression: `SET ${objKeys.map((_, index) => `#key${index} = :value${index}`).join(", ")}`,
      ExpressionAttributeNames: objKeys.reduce((acc, key, index) => ({
          ...acc,
          [`#key${index}`]: key,
      }), {}),
      ExpressionAttributeValues: marshall(objKeys.reduce((acc, key, index) => ({
          ...acc,
          [`:value${index}`]: requestBody[key],
      }), {})),
    };

    const updateResult = await ddbClient.send(new UpdateItemCommand(params));
    console.log(updateResult);
    return updateResult;

  } catch(e) {
    console.error(e);
    throw e;
  }
}