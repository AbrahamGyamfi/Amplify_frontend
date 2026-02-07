import React, { useState } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './App.css';
import './config/amplifyConfig';
import Header from './components/Header';
import ErrorMessage from './components/ErrorMessage';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import { useAuth } from './hooks/useAuth';
import { useTasks } from './hooks/useTasks';

function App() {
  const { user, userRole, handleSignOut } = useAuth();
  const { 
    tasks, 
    loading, 
    error, 
    setError, 
    createTask, 
    updateTaskStatus, 
    deleteTask 
  } = useTasks(user, userRole);
  
  const [newTask, setNewTask] = useState({ 
    title: '', 
    description: '', 
    assignedTo: [], 
    dueDate: '', 
    priority: 'medium' 
  });
  const [filterStatus, setFilterStatus] = useState('all');

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (userRole !== 'admin') {
      setError('Only admins can create tasks');
      return;
    }

    const result = await createTask(newTask);
    if (result.success) {
      setNewTask({ 
        title: '', 
        description: '', 
        assignedTo: [], 
        dueDate: '', 
        priority: 'medium' 
      });
    }
  };

  return (
    <Authenticator
      signUpAttributes={['email', 'name']}
      socialProviders={[]}
    >
      {({ signOut, user }) => (
        <div className="App">
          <Header 
            userEmail={user?.attributes?.email} 
            userRole={userRole} 
            onSignOut={handleSignOut} 
          />

          <main className="main-content">
            <ErrorMessage message={error} onClose={() => setError(null)} />

            {loading && <div className="loading">Loading...</div>}

            {userRole === 'admin' && (
              <TaskForm
                newTask={newTask}
                setNewTask={setNewTask}
                onSubmit={handleCreateTask}
                loading={loading}
              />
            )}

            <TaskList
              tasks={tasks}
              userRole={userRole}
              filterStatus={filterStatus}
              onFilterChange={setFilterStatus}
              onStatusChange={updateTaskStatus}
              onDelete={deleteTask}
              loading={loading}
            />
          </main>
        </div>
      )}
    </Authenticator>
  );
}

export default App;