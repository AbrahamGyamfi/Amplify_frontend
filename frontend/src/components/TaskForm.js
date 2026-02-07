import React from 'react';

const TaskForm = ({ 
  newTask, 
  setNewTask, 
  onSubmit, 
  loading 
}) => {
  const addAssignee = () => {
    setNewTask({ ...newTask, assignedTo: [...newTask.assignedTo, ''] });
  };

  const updateAssignee = (index, value) => {
    const updatedAssignees = [...newTask.assignedTo];
    updatedAssignees[index] = value;
    setNewTask({ ...newTask, assignedTo: updatedAssignees });
  };

  const removeAssignee = (index) => {
    const updatedAssignees = newTask.assignedTo.filter((_, i) => i !== index);
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
          {newTask.assignedTo.map((email, index) => (
            <div key={index} className="assignee-input">
              <input
                type="email"
                placeholder="member@amalitechtraining.org"
                value={email}
                onChange={(e) => updateAssignee(index, e.target.value)}
                required
              />
              <button 
                type="button" 
                onClick={() => removeAssignee(index)} 
                className="remove-btn"
              >
                Remove
              </button>
            </div>
          ))}
          <button 
            type="button" 
            onClick={addAssignee} 
            className="add-assignee-btn"
          >
            + Add Member
          </button>
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
