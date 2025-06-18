
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update task description', async () => {
    // Create a task directly in database for testing
    const createResult = await db.insert(tasksTable)
      .values({
        description: 'Original task',
        status: 'pending'
      })
      .returning()
      .execute();

    const createdTask = createResult[0];

    // Update the task description
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      description: 'Updated task description'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(createdTask.id);
    expect(result.description).toEqual('Updated task description');
    expect(result.status).toEqual('pending'); // Should remain unchanged
    expect(result.created_at).toEqual(createdTask.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTask.updated_at.getTime());
  });

  it('should update task status', async () => {
    // Create a task directly in database for testing
    const createResult = await db.insert(tasksTable)
      .values({
        description: 'Test task',
        status: 'pending'
      })
      .returning()
      .execute();

    const createdTask = createResult[0];

    // Update the task status
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      status: 'completed'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(createdTask.id);
    expect(result.description).toEqual('Test task'); // Should remain unchanged
    expect(result.status).toEqual('completed');
    expect(result.created_at).toEqual(createdTask.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTask.updated_at.getTime());
  });

  it('should update both description and status', async () => {
    // Create a task directly in database for testing
    const createResult = await db.insert(tasksTable)
      .values({
        description: 'Original task',
        status: 'pending'
      })
      .returning()
      .execute();

    const createdTask = createResult[0];

    // Update both fields
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      description: 'Updated description',
      status: 'completed'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(createdTask.id);
    expect(result.description).toEqual('Updated description');
    expect(result.status).toEqual('completed');
    expect(result.created_at).toEqual(createdTask.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTask.updated_at.getTime());
  });

  it('should save updated task to database', async () => {
    // Create a task directly in database for testing
    const createResult = await db.insert(tasksTable)
      .values({
        description: 'Test task',
        status: 'pending'
      })
      .returning()
      .execute();

    const createdTask = createResult[0];

    // Update the task
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      description: 'Updated from database test',
      status: 'completed'
    };

    await updateTask(updateInput);

    // Verify the task was updated in the database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].description).toEqual('Updated from database test');
    expect(tasks[0].status).toEqual('completed');
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at.getTime()).toBeGreaterThan(createdTask.updated_at.getTime());
  });

  it('should throw error when task does not exist', async () => {
    const updateInput: UpdateTaskInput = {
      id: 99999, // Non-existent ID
      description: 'This should fail'
    };

    await expect(updateTask(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should only update updated_at when no other fields provided', async () => {
    // Create a task directly in database for testing
    const createResult = await db.insert(tasksTable)
      .values({
        description: 'Test task',
        status: 'pending'
      })
      .returning()
      .execute();

    const createdTask = createResult[0];

    // Update with only ID (no other fields)
    const updateInput: UpdateTaskInput = {
      id: createdTask.id
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(createdTask.id);
    expect(result.description).toEqual('Test task'); // Should remain unchanged
    expect(result.status).toEqual('pending'); // Should remain unchanged
    expect(result.created_at).toEqual(createdTask.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTask.updated_at.getTime());
  });
});
