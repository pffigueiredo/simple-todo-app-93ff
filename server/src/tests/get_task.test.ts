
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetTaskInput } from '../schema';
import { getTask } from '../handlers/get_task';

describe('getTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a task when found', async () => {
    // Create a test task first
    const insertResult = await db.insert(tasksTable)
      .values({
        description: 'Test task for retrieval',
        status: 'pending'
      })
      .returning()
      .execute();

    const createdTask = insertResult[0];

    const input: GetTaskInput = {
      id: createdTask.id
    };

    const result = await getTask(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTask.id);
    expect(result!.description).toEqual('Test task for retrieval');
    expect(result!.status).toEqual('pending');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when task not found', async () => {
    const input: GetTaskInput = {
      id: 999999 // Non-existent ID
    };

    const result = await getTask(input);

    expect(result).toBeNull();
  });

  it('should return task with completed status', async () => {
    // Create a completed task
    const insertResult = await db.insert(tasksTable)
      .values({
        description: 'Completed test task',
        status: 'completed'
      })
      .returning()
      .execute();

    const createdTask = insertResult[0];

    const input: GetTaskInput = {
      id: createdTask.id
    };

    const result = await getTask(input);

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('completed');
    expect(result!.description).toEqual('Completed test task');
  });
});
