import * as uuid from 'uuid'
import { TodoItem } from '../models/TodoItem'
import { TodoAccess } from '../dataLayer/todoAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { parseUserId } from '../auth/utils'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const todoAccess = new TodoAccess()

export async function getAllTodos(): Promise<TodoItem[]> {
  return todoAccess.getAllTodos()
}

export async function getAllTodosForUser(jwtToken: string): Promise<TodoItem[]> {
    return await todoAccess.getAllTodosForUser(parseUserId(jwtToken))
  }

export async function createTodo(createTodoRequest: CreateTodoRequest, jwtToken: string): Promise<TodoItem> {

  const todoId = uuid.v4()
  const userId = parseUserId(jwtToken)

  return await todoAccess.createTodo({
    userId: userId,
    todoId: todoId,
    createdAt: new Date().toISOString(),
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    done: false,
  })
}

export async function getSignedUrl(todoId: string, userId: string){
  //generating the url
  const attachmentUrl = await todoAccess.generateSignedUrl(todoId)
  
  //updating the attachment URL for the TODO item
  await todoAccess.updateAttachementUrl(todoId, userId)
  
  return attachmentUrl
}

export async function deleteTodo(todoId: string, jwtToken: string) {
 
  const userId = parseUserId(jwtToken)  

  await todoAccess.deleteTodo(userId, todoId)
}

export async function updatedTodo(todoId: string, updateTodo: UpdateTodoRequest, jwtToken: string) {
  const userId = parseUserId(jwtToken)  
  return await todoAccess.updateTodo(userId, todoId, updateTodo)
}