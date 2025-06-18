
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { getTasks } from '../handlers/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();
    
    expect(result).toEqual([]);
  });

  it('should return all tasks', async () => {
    // Create test tasks
    await db.insert(tasksTable)
      .values([
        { description: 'Task 1', status: 'pending' },
        { description: 'Task 2', status: 'completed' },
        { description: 'Task 3', status: 'pending' }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    expect(result[0].description).toEqual('Task 1');
    expect(result[1].description).toEqual('Task 2');
    expect(result[2].description).toEqual('Task 3');
  });

  it('should return tasks with all required fields', async () => {
    // Create a test task
    await db.insert(tasksTable)
      .values({ description: 'Test Task', status: 'pending' })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(1);
    const task = result[0];
    
    expect(task.id).toBeDefined();
    expect(typeof task.id).toBe('number');
    expect(task.description).toEqual('Test Task');
    expect(task.status).toEqual('pending');
    expect(task.created_at).toBeInstanceOf(Date);
    expect(task.updated_at).toBeInstanceOf(Date);
  });

  it('should return tasks ordered by creation date (newest first)', async () => {
    // Create tasks with slight delay to ensure different timestamps
    await db.insert(tasksTable)
      .values({ description: 'First Task', status: 'pending' })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(tasksTable)
      .values({ description: 'Second Task', status: 'completed' })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(tasksTable)
      .values({ description: 'Third Task', status: 'pending' })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    // Newest first (Third Task should be first)
    expect(result[0].description).toEqual('Third Task');
    expect(result[1].description).toEqual('Second Task');
    expect(result[2].description).toEqual('First Task');
    
    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should handle different task statuses', async () => {
    // Create tasks with different statuses
    await db.insert(tasksTable)
      .values([
        { description: 'Pending Task', status: 'pending' },
        { description: 'Completed Task', status: 'completed' }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    
    const pendingTask = result.find(task => task.status === 'pending');
    const completedTask = result.find(task => task.status === 'completed');
    
    expect(pendingTask).toBeDefined();
    expect(pendingTask?.description).toEqual('Pending Task');
    expect(completedTask).toBeDefined();
    expect(completedTask?.description).toEqual('Completed Task');
  });
});
