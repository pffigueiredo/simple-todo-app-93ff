
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTask = async (input: UpdateTaskInput): Promise<Task> => {
  try {
    // Build update values object with only provided fields
    const updateValues: any = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.description !== undefined) {
      updateValues.description = input.description;
    }

    if (input.status !== undefined) {
      updateValues.status = input.status;
    }

    // Update the task
    const result = await db.update(tasksTable)
      .set(updateValues)
      .where(eq(tasksTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Task with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Task update failed:', error);
    throw error;
  }
};
