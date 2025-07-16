import { useRef, useEffect } from "react";
import "../styles/global.css";
import ImageUploadBox from "./ImageUploadBox";
import CameraView from "./CameraView";
import ResultPanel from "./ResultPanel";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; /* or http://localhost:5000/classify if local*/

const Hero = ({
  showClassify,
  setShowClassify,
  image,
  setImage,
  result,
  setResult,
  loading,
  setLoading,
  showOptions,
  setShowOptions,
  usingCamera,
  setUsingCamera,
  capturedPreview,
  setCapturedPreview,
}) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setCapturedPreview(URL.createObjectURL(file));
      stopCamera();
      setShowOptions(false);
    }
  };

  const sendToBackend = async () => {
    if (!image) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("image", image);

    try {
      const res = await fetch(`${BACKEND_URL}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Error sending to backend:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    if (!image && !usingCamera) setShowOptions((prev) => !prev);
  };

  const handleUseCamera = async () => {
    setUsingCamera(true);
    setShowOptions(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
    } catch (err) {
      console.error("Cannot access camera:", err);
    }
  };

  const captureFromCamera = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "captured.png", { type: "image/png" });
        setImage(file);
        setCapturedPreview(URL.createObjectURL(blob));
        stopCamera();
      }
    }, "image/png");
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setUsingCamera(false);
  };

  const handleRemoveImage = () => {
    setImage(null);
    setCapturedPreview(null);
    setResult(null);
    setUsingCamera(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <section className="hero" id="hero">
      <div className={`hero-image-container ${showClassify ? "classify-mode" : ""}`}>
        <div className="hero-image-overlay">
          {!showClassify ? (
            <>
              <div className="hero-content">
                <h1>Smarter Recycling with AI</h1>
                <p>
                  A next-generation solution that uses artificial intelligence to identify,
                  classify, and separate recyclable materials from general waste—reducing
                  contamination, saving time, and supporting a cleaner planet through automated
                  decision-making.
                </p>
              </div>
              <button className="classify-btn" onClick={() => setShowClassify(true)}>
                Classify Your Waste →
              </button>
            </>
          ) : (
            <div className="classify-mode-ui">
              <div className="classify-left">
                <div className="upload-wrapper">
                  <ImageUploadBox
                    image={image}
                    capturedPreview={capturedPreview}
                    usingCamera={usingCamera}
                    showOptions={showOptions}
                    handleUploadClick={handleUploadClick}
                    handleRemoveImage={handleRemoveImage}
                    handleImageChange={handleImageChange}
                    handleUseCamera={handleUseCamera}
                    fileInputRef={fileInputRef}
                  >
                    {usingCamera && (
                      <CameraView videoRef={videoRef} captureFromCamera={captureFromCamera} />
                    )}
                  </ImageUploadBox>

                  {image && (
                    <button className="classify-action-btn" onClick={sendToBackend}>
                      {loading ? "Classifying..." : "Classify"}
                    </button>
                  )}
                </div>
              </div>

              <ResultPanel result={result} loading={loading} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;