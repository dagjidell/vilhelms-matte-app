import { useState } from 'react';
import './TeacherCommon.css';

export default function AdditionTeacher() {
  return (
    <div className="teacher-container">
      <div className="teacher-card">
        <h1>Addition</h1>
        <p className="coming-soon">Kommer snart...</p>
        <div className="placeholder-content">
          <div className="placeholder-box">
            <span>+</span>
          </div>
        </div>
      </div>
    </div>
  );
}
