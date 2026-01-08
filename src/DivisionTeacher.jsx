import { useState } from 'react';
import './TeacherCommon.css';

export default function DivisionTeacher() {
  return (
    <div className="teacher-container">
      <div className="teacher-card">
        <h1>Division</h1>
        <p className="coming-soon">Kommer snart...</p>
        <div className="placeholder-content">
          <div className="placeholder-box">
            <span>÷</span>
          </div>
        </div>
      </div>
    </div>
  );
}
