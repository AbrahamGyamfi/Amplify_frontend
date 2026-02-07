import React, { useState, useEffect } from 'react';
import { Auth } from 'aws-amplify';

const API_URL = process.env.REACT_APP_API_URL;

const TaskForm = ({ 
  newTask, 
  setNewTask, 
  onSubmit, 
  loading 
}) => {
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();
      
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const activeUsers = (data.users || []).filter(user => user.status === 'active');
        setMembers(activeUsers);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleMemberSelection = (email) => {
    const updatedAssignees = newTask.assignedTo.includes(email)
      ? newTask.assignedTo.filter(e => e !== email)
      : [...newTask.assignedTo, email];
    setNewTask({ ...newTask, assignedTo: updatedAssignees });
  };

  return (
    <section className="create-task">
      <h2>Create New Task</h2>
      <form onSubmit={onSubmit}>
        <input
          type="text"
          placeholder="Task Title *"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Task Description *"
          value={newTask.description}
          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          required
        />
        
        <div className="assignees-section">
          <label>Assign to Members: *</label>
          {loadingMembers ? (
            <p>Loading members...</p>
          ) : (
            <div className="members-list">
              {members.length === 0 ? (
                <p>No members available</p>
              ) : (
                members.map((member) => (
                  <label key={member.email} className="member-checkbox">
                    <input
                      type="checkbox"
                      checked={newTask.assignedTo.includes(member.email)}
                      onChange={() => handleMemberSelection(member.email)}
                    />
                    <span>{member.email} ({member.role})</span>
                  </label>
                ))
              )}
            </div>
          )}
          {newTask.assignedTo.length > 0 && (
            <div className="selected-members">
              <strong>Selected:</strong> {newTask.assignedTo.join(', ')}
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Due Date:</label>
            <input
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Priority:</label>
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || newTask.assignedTo.length === 0}
        >
          Create Task
        </button>
      </form>
    </section>
  );
};

export default TaskForm;
