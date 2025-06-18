
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task', async () => {
    // Create a test task first
    const createResult = await db.insert(tasksTable)
      .values({
        description: 'Test task to delete',
        status: 'pending'
      })
      .returning()
      .execute();

    const taskId = createResult[0].id;

    // Delete the task
    const input: DeleteTaskInput = { id: taskId };
    const result = await deleteTask(input);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify task no longer exists in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should return false when deleting non-existent task', async () => {
    // Try to delete a task that doesn't exist
    const input: DeleteTaskInput = { id: 99999 };
    const result = await deleteTask(input);

    // Verify deletion was not successful
    expect(result.success).toBe(false);
  });

  it('should not affect other tasks when deleting one task', async () => {
    // Create multiple test tasks
    const createResults = await db.insert(tasksTable)
      .values([
        { description: 'Task 1', status: 'pending' },
        { description: 'Task 2', status: 'completed' },
        { description: 'Task 3', status: 'pending' }
      ])
      .returning()
      .execute();

    const taskToDelete = createResults[1].id;

    // Delete one task
    const input: DeleteTaskInput = { id: taskToDelete };
    const result = await deleteTask(input);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify other tasks still exist
    const remainingTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(remainingTasks).toHaveLength(2);
    expect(remainingTasks.map(t => t.id)).not.toContain(taskToDelete);
    expect(remainingTasks.some(t => t.description === 'Task 1')).toBe(true);
    expect(remainingTasks.some(t => t.description === 'Task 3')).toBe(true);
  });
});
