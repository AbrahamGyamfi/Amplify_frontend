import React from 'react';

const TaskCard = ({ 
  task, 
  userRole, 
  onStatusChange, 
  onDelete, 
  loading 
}) => {
  return (
    <div className={`task-card ${task.status} priority-${task.priority}`}>
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
          onChange={(e) => onStatusChange(task.taskId, e.target.value)}
          disabled={loading || (userRole === 'Member' && task.status === 'closed')}
        >
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          {userRole === 'Admin' && <option value="closed">Closed</option>}
        </select>
        
        {userRole === 'Admin' && (
          <button 
            onClick={() => onDelete(task.taskId)} 
            className="delete-btn"
            disabled={loading}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
