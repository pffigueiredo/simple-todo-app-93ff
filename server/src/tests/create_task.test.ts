
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateTaskInput = {
  description: 'Test task description'
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task with default pending status', async () => {
    const result = await createTask(testInput);

    // Basic field validation
    expect(result.description).toEqual('Test task description');
    expect(result.status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const result = await createTask(testInput);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].description).toEqual('Test task description');
    expect(tasks[0].status).toEqual('pending');
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different task descriptions', async () => {
    const inputs = [
      { description: 'Simple task' },
      { description: 'Task with special characters: !@#$%^&*()' },
      { description: 'Very long task description that contains multiple words and should still be handled correctly by the system' }
    ];

    for (const input of inputs) {
      const result = await createTask(input);
      
      expect(result.description).toEqual(input.description);
      expect(result.status).toEqual('pending');
      expect(result.id).toBeDefined();
    }
  });

  it('should set timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createTask(testInput);
    const afterCreation = new Date();

    // Verify timestamps are within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime() - 1000);
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime() + 1000);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime() - 1000);
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime() + 1000);
  });
});
