import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as AWS  from 'aws-sdk'

import { TodoUpdate } from '../models/TodoUpdate'
import {TodoItem} from '../models/TodoItem'

export class TodoAccess{

    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly todoTable = process.env.TODOS_TABLE,
        private readonly s3 = new AWS.S3({ signatureVersion: 'v4'}),
        private readonly bucketName = process.env.S3_BUCKET
        ){
    }

    async getAllTodos(): Promise<TodoItem[]> {
    
        const result = await this.docClient.scan({
          TableName: this.todoTable
        }).promise()
    
        const items = result.Items
        return items as TodoItem[]
    }

    async getAllTodosForUser(userId: string): Promise<TodoItem[]> {
    
        const result = await this.docClient.query({
          TableName: this.todoTable,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues:{
              ':userId': userId
          }
        }).promise()
  
        const items = result.Items
        return items as TodoItem[]
    }
    
    async createTodo(todoItem: TodoItem): Promise<TodoItem> {
        await this.docClient.put({
        TableName: this.todoTable,
        Item: todoItem
        }).promise()
    
        return todoItem
    }

    async generateSignedUrl(todoId: string){

        return this.s3.getSignedUrl('putObject', {
          Bucket: this.bucketName,
          Key: todoId,
          Expires: 300
        })
    
      }

    async deleteTodo(userId: string, todoId: string) {

        await this.docClient
            .delete({
                TableName: this.todoTable,
                Key: {
                    "userId" : userId,
                    "todoId" : todoId
                },
            }).promise();

        console.log("Deleted todo " + todoId)
    }

    async updateAttachementUrl(todoId: string, userId: string){

        const url = `https://${this.bucketName}.s3.amazonaws.com/${todoId}`
    
        var params = {
            TableName: this.todoTable,
            Key:{
                "userId": userId,
                "todoId": todoId
            },
            UpdateExpression: "set attachmentUrl = :au",
            ExpressionAttributeValues: {
                    ":au" : url,
            },
            ReturnValues:"UPDATED_NEW"
        }
        
        await this.docClient.update(params, function(err, data) {
            if (err) {
                console.error("Unable to update item with the attachment. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
            }
        }).promise()
        
      }

    async updateTodo(userId: string, todoId: string, todoUpdate: TodoUpdate) {
        var params = {
            TableName: this.todoTable,
            Key: {
                "userId" : userId,
                "todoId" : todoId,
            },
            UpdateExpression: 'set #name = :name, #dueDate = :dueDate, #done = :done',
            ExpressionAttributeValues: {
              ":name": todoUpdate.name,
              ":dueDate" : todoUpdate.dueDate,
              ":done" : todoUpdate.done,
            },
            ExpressionAttributeNames: {
              "#name": 'name',
              "#dueDate": 'dueDate',
              "#done": 'done'
            },
            ReturnValues:"UPDATED_NEW"
          }
          
          
        await this.docClient.update(params, function(err, data) {
            if (err) console.log(err);
            else console.log(data);
        }).promise()

    }
}

function createDynamoDBClient(){
    if(process.env.IS_OFFLINE){
        console.log("Creating a local DynamoDB instance")
        return new AWS.DynamoDB.DocumentClient({
            region: 'localhost',
            endpoint: 'http://localhost:8000'
        })
    }

    return new AWS.DynamoDB.DocumentClient()
}

