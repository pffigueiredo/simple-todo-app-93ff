
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Plus, CheckCircle2, Clock } from 'lucide-react';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../../server/src/schema';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Load all tasks
  const loadTasks = useCallback(async () => {
    try {
      const result = await trpc.getTasks.query();
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Create a new task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskDescription.trim()) return;

    setIsLoading(true);
    try {
      const taskData: CreateTaskInput = {
        description: newTaskDescription.trim()
      };
      const newTask = await trpc.createTask.mutate(taskData);
      setTasks((prev: Task[]) => [...prev, newTask]);
      setNewTaskDescription('');
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle task status (pending <-> completed)
  const handleToggleStatus = async (task: Task) => {
    try {
      const updateData: UpdateTaskInput = {
        id: task.id,
        status: task.status === 'pending' ? 'completed' : 'pending'
      };
      const updatedTask = await trpc.updateTask.mutate(updateData);
      setTasks((prev: Task[]) => 
        prev.map((t: Task) => t.id === task.id ? updatedTask : t)
      );
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  // Start editing a task
  const handleStartEdit = (task: Task) => {
    setEditingTask(task);
    setEditDescription(task.description);
    setIsEditDialogOpen(true);
  };

  // Save edited task
  const handleSaveEdit = async () => {
    if (!editingTask || !editDescription.trim()) return;

    try {
      const updateData: UpdateTaskInput = {
        id: editingTask.id,
        description: editDescription.trim()
      };
      const updatedTask = await trpc.updateTask.mutate(updateData);
      setTasks((prev: Task[]) => 
        prev.map((t: Task) => t.id === editingTask.id ? updatedTask : t)
      );
      setIsEditDialogOpen(false);
      setEditingTask(null);
      setEditDescription('');
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  // Delete a task
  const handleDeleteTask = async (taskId: number) => {
    try {
      await trpc.deleteTask.mutate({ id: taskId });
      setTasks((prev: Task[]) => prev.filter((t: Task) => t.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  // Calculate task statistics
  const completedTasks = tasks.filter((task: Task) => task.status === 'completed');
  const pendingTasks = tasks.filter((task: Task) => task.status === 'pending');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">✅ My Todo App</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">{pendingTasks.length}</p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add New Task Form */}
        <Card className="mb-8 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTask} className="flex gap-2">
              <Input
                placeholder="What do you need to do? 🎯"
                value={newTaskDescription}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setNewTaskDescription(e.target.value)
                }
                className="flex-1"
                required
              />
              <Button type="submit" disabled={isLoading || !newTaskDescription.trim()}>
                {isLoading ? 'Adding...' : 'Add Task'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Your Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-500 text-lg mb-2">No tasks yet!</p>
                <p className="text-gray-400">Add your first task above to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task: Task) => (
                  <div 
                    key={task.id} 
                    className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                      task.status === 'completed' 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {/* Checkbox for status toggle */}
                    <Checkbox
                      checked={task.status === 'completed'}
                      onCheckedChange={() => handleToggleStatus(task)}
                      className="flex-shrink-0"
                    />

                    {/* Task content */}
                    <div className="flex-1 min-w-0">
                      <p 
                        className={`font-medium ${
                          task.status === 'completed' 
                            ? 'text-green-700 line-through' 
                            : 'text-gray-900'
                        }`}
                      >
                        {task.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Created: {task.created_at.toLocaleDateString()} at {task.created_at.toLocaleTimeString()}
                      </p>
                    </div>

                    {/* Status badge */}
                    <Badge 
                      variant={task.status === 'completed' ? 'default' : 'secondary'}
                      className={
                        task.status === 'completed' 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                      }
                    >
                      {task.status === 'completed' ? '✅ Completed' : '⏱️ Pending'}
                    </Badge>

                    {/* Action buttons */}
                    <div className="flex gap-1">
                      {/* Edit button */}
                      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEdit(task)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Task</DialogTitle>
                            <DialogDescription>
                              Update your task description below.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="edit-description">Description</Label>
                              <Input
                                id="edit-description"
                                value={editDescription}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                  setEditDescription(e.target.value)
                                }
                                placeholder="Task description"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsEditDialogOpen(false);
                                setEditingTask(null);
                                setEditDescription('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleSaveEdit}>
                              Save Changes
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Delete button */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Task</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this task? This action cannot be undone.
                              <br />
                              <br />
                              <strong>"{task.description}"</strong>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTask(task.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500">
          <p className="text-sm">
            {tasks.length > 0 && completedTasks.length === tasks.length && (
              <span className="text-green-600 font-medium">🎉 All tasks completed! Great job!</span>
            )}
            {tasks.length > 0 && completedTasks.length < tasks.length && (
              <span>Keep going! You have {pendingTasks.length} task{pendingTasks.length === 1 ? '' : 's'} left.</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
