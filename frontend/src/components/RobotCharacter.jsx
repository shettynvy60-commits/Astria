import React from 'react';

export default function RobotCharacter({ className = '' }) {
  return (
    <div className={`robot-guide ${className}`} aria-hidden="true">
      <span className="robot-guide__antenna" />
      <span className="robot-guide__antenna-light" />
      <div className="robot-guide__head">
        <div className="robot-guide__screen">
          <span className="robot-guide__eye" />
          <span className="robot-guide__eye" />
        </div>
      </div>
      <span className="robot-guide__neck" />
      <span className="robot-guide__arm robot-guide__arm--left" />
      <div className="robot-guide__body">
        <span className="robot-guide__chest-light" />
      </div>
      <span className="robot-guide__arm robot-guide__arm--right" />
      <span className="robot-guide__leg robot-guide__leg--left" />
      <span className="robot-guide__leg robot-guide__leg--right" />
      <span className="robot-guide__shadow" />
    </div>
  );
}