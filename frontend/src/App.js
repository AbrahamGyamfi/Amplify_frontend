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
  const [userRole, setUserRole] = useState('member');
  const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: '' });

  useEffect(() => {
    checkUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      setUser(currentUser);
      const email = currentUser.attributes?.email;
      if (email?.includes('@amalitech.com')) {
        setUserRole('admin');
      }
      fetchTasks(currentUser);
    } catch (error) {
      console.log('No user signed in');
    }
  };

  const fetchTasks = async (currentUser) => {
    try {
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();
      
      const response = await fetch(`${API_URL}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    if (userRole !== 'admin') return;

    try {
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();
      
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTask)
      });

      if (response.ok) {
        setNewTask({ title: '', description: '', assignedTo: '' });
        fetchTasks(user);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
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

      if (response.ok) {
        fetchTasks(user);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await Auth.signOut();
      setUser(null);
      setTasks([]);
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
              <span className="role-badge">{userRole}</span>
              <button onClick={handleSignOut} className="sign-out-btn">Sign Out</button>
            </div>
          </header>

          <main className="main-content">
            {userRole === 'admin' && (
              <section className="create-task">
                <h2>Create New Task</h2>
                <form onSubmit={createTask}>
                  <input
                    type="text"
                    placeholder="Task Title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    required
                  />
                  <textarea
                    placeholder="Task Description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Assign to (email)"
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                    required
                  />
                  <button type="submit">Create Task</button>
                </form>
              </section>
            )}

            <section className="tasks-list">
              <h2>{userRole === 'admin' ? 'All Tasks' : 'My Tasks'}</h2>
              <div className="tasks-grid">
                {tasks.map(task => (
                  <div key={task.taskId} className={`task-card ${task.status}`}>
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>
                    <div className="task-meta">
                      <span>Assigned to: {task.assignedTo}</span>
                      <span>Status: {task.status}</span>
                      <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="task-actions">
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.taskId, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>
        </div>
      )}
    </Authenticator>
  );
}

export default App;