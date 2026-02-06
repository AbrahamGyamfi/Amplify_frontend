import React, { useState, useEffect } from 'react';
import { Amplify, Auth } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './App.css';

// Configure Amplify with environment variables
Amplify.configure({
  Auth: {
    region: process.env.REACT_APP_REGION,
    userPoolId: process.env.REACT_APP_USER_POOL_ID,
    userPoolWebClientId: process.env.REACT_APP_CLIENT_ID,
    mandatorySignIn: true,
    authenticationFlowType: 'USER_SRP_AUTH'
  }
});

const API_URL = process.env.REACT_APP_API_URL;

function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [userRole, setUserRole] = useState('Member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newTask, setNewTask] = useState({ 
    title: '', 
    description: '', 
    assignedTo: [], 
    dueDate: '', 
    priority: 'medium' 
  });
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    checkUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUser = async () => {
    try {
      setLoading(true);
      const currentUser = await Auth.currentAuthenticatedUser();
      setUser(currentUser);
      
      // Get role from Cognito custom attribute
      const role = currentUser.attributes['custom:role'] || 'Member';
      setUserRole(role);
      
      fetchTasks(currentUser);
    } catch (error) {
      console.log('No user signed in');
      setError('Please sign in to continue');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async (currentUser) => {
    try {
      setLoading(true);
      setError(null);
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();
      
      const response = await fetch(`${API_URL}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    if (userRole !== 'Admin') {
      setError('Only admins can create tasks');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();
      
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
          assignedTo: newTask.assignedTo.filter(email => email.trim()),
          dueDate: newTask.dueDate,
          priority: newTask.priority
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create task');
      }

      setNewTask({ title: '', description: '', assignedTo: [], dueDate: '', priority: 'medium' });
      fetchTasks(user);
      setError(null);
    } catch (error) {
      console.error('Error creating task:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      setLoading(true);
      setError(null);
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();
      
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ taskId, status })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update task');
      }

      fetchTasks(user);
    } catch (error) {
      console.error('Error updating task:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    if (userRole !== 'Admin') {
      setError('Only admins can delete tasks');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();
      
      const response = await fetch(`${API_URL}/tasks?taskId=${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete task');
      }

      fetchTasks(user);
    } catch (error) {
      console.error('Error deleting task:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await Auth.signOut();
      setUser(null);
      setTasks([]);
      setUserRole('Member');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const addAssignee = () => {
    setNewTask({...newTask, assignedTo: [...newTask.assignedTo, '']});
  };

  const updateAssignee = (index, value) => {
    const updatedAssignees = [...newTask.assignedTo];
    updatedAssignees[index] = value;
    setNewTask({...newTask, assignedTo: updatedAssignees});
  };

  const removeAssignee = (index) => {
    const updatedAssignees = newTask.assignedTo.filter((_, i) => i !== index);
    setNewTask({...newTask, assignedTo: updatedAssignees});
  };

  const getFilteredTasks = () => {
    if (filterStatus === 'all') return tasks;
    return tasks.filter(task => task.status === filterStatus);
  };

  return (
    <Authenticator
      signUpAttributes={['email']}
      socialProviders={[]}
    >
      {({ signOut, user }) => (
        <div className="App">
          <header className="App-header">
            <h1>Task Management System</h1>
            <div className="user-info">
              <span>Welcome, {user?.attributes?.email}</span>
              <span className={`role-badge ${userRole.toLowerCase()}`}>{userRole}</span>
              <button onClick={handleSignOut} className="sign-out-btn">Sign Out</button>
            </div>
          </header>

          <main className="main-content">
            {error && (
              <div className="error-message">
                {error}
                <button onClick={() => setError(null)}>×</button>
              </div>
            )}

            {loading && <div className="loading">Loading...</div>}

            {userRole === 'Admin' && (
              <section className="create-task">
                <h2>Create New Task</h2>
                <form onSubmit={createTask}>
                  <input
                    type="text"
                    placeholder="Task Title *"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    required
                  />
                  <textarea
                    placeholder="Task Description *"
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    required
                  />
                  
                  <div className="assignees-section">
                    <label>Assign to Members: *</label>
                    {newTask.assignedTo.map((email, index) => (
                      <div key={index} className="assignee-input">
                        <input
                          type="email"
                          placeholder="member@amalitechtraining.org"
                          value={email}
                          onChange={(e) => updateAssignee(index, e.target.value)}
                          required
                        />
                        <button type="button" onClick={() => removeAssignee(index)} className="remove-btn">
                          Remove
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={addAssignee} className="add-assignee-btn">
                      + Add Member
                    </button>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Due Date:</label>
                      <input
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Priority:</label>
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" disabled={loading || newTask.assignedTo.length === 0}>
                    Create Task
                  </button>
                </form>
              </section>
            )}

            <section className="tasks-list">
              <div className="tasks-header">
                <h2>{userRole === 'Admin' ? 'All Tasks' : 'My Tasks'} ({getFilteredTasks().length})</h2>
                <div className="filter-controls">
                  <label>Filter by Status:</label>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {getFilteredTasks().length === 0 ? (
                <div className="no-tasks">
                  {userRole === 'Admin' 
                    ? 'No tasks created yet. Create your first task above!' 
                    : 'No tasks assigned to you yet.'}
                </div>
              ) : (
                <div className="tasks-grid">
                  {getFilteredTasks().map(task => (
                    <div key={task.taskId} className={`task-card ${task.status} priority-${task.priority}`}>
                      <div className="task-header">
                        <h3>{task.title}</h3>
                        <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
                      </div>
                      <p>{task.description}</p>
                      
                      <div className="task-meta">
                        <div>
                          <strong>Assigned to:</strong> 
                          <div className="assignees-list">
                            {task.assignedMembers?.map((email, idx) => (
                              <span key={idx} className="assigned-member">{email}</span>
                            ))}
                          </div>
                        </div>
                        <div><strong>Status:</strong> {task.status}</div>
                        <div><strong>Created by:</strong> {task.createdBy}</div>
                        <div><strong>Created:</strong> {new Date(task.createdAt).toLocaleDateString()}</div>
                        {task.dueDate && (
                          <div><strong>Due:</strong> {new Date(task.dueDate).toLocaleDateString()}</div>
                        )}
                      </div>
                      
                      <div className="task-actions">
                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.taskId, e.target.value)}
                          disabled={loading}
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                          {userRole === 'Admin' && <option value="closed">Closed</option>}
                        </select>
                        
                        {userRole === 'Admin' && (
                          <button 
                            onClick={() => deleteTask(task.taskId)} 
                            className="delete-btn"
                            disabled={loading}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>
      )}
    </Authenticator>
  );
}

export default App;