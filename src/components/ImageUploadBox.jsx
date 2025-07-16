import React from "react";

const ImageUploadBox = ({
  image,
  capturedPreview,
  usingCamera,
  showOptions,
  handleUploadClick,
  handleRemoveImage,
  handleImageChange,
  handleUseCamera,
  fileInputRef,
  children,
}) => {
  return (
    <div className="upload-box" onClick={handleUploadClick}>
      {image ? (
        <div className="image-preview-container">
          <img src={capturedPreview} alt="preview" className="captured-image" />
          <button className="remove-image-btn" onClick={handleRemoveImage}>
            &times;
          </button>
        </div>
      ) : usingCamera ? (
        children // this is where <CameraView /> will be injected
      ) : (
        <>
          <div className="camera-icon">📷</div>
          <p>Upload Image</p>
          {showOptions && (
            <div className="upload-options" onClick={(e) => e.stopPropagation()}>
              <div className="upload-option" onClick={() => fileInputRef.current.click()}>
                📁 From device
              </div>
              <div className="upload-option" onClick={handleUseCamera}>
                📷 Use live camera
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ImageUploadBox;