import React, { useRef, useEffect } from "react";

const CameraView = ({ videoRef, captureFromCamera }) => {
  return (
    <div className="camera-wrapper">
      <video ref={videoRef} autoPlay playsInline className="camera-preview" />
      <button
        className="capture-btn"
        onClick={(e) => {
          e.stopPropagation();
          captureFromCamera();
        }}
      >
        📸
      </button>
    </div>
  );
};

export default CameraView;