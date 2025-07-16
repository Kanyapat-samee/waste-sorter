import { useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/hero";

const App = () => {
  const [showClassify, setShowClassify] = useState(false);
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [usingCamera, setUsingCamera] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState(null);

  return (
    <>
      <Navbar setShowClassify={setShowClassify} />
      <Hero
        showClassify={showClassify}
        setShowClassify={setShowClassify}
        image={image}
        setImage={setImage}
        result={result}
        setResult={setResult}
        loading={loading}
        setLoading={setLoading}
        showOptions={showOptions}
        setShowOptions={setShowOptions}
        usingCamera={usingCamera}
        setUsingCamera={setUsingCamera}
        capturedPreview={capturedPreview}
        setCapturedPreview={setCapturedPreview}
      />
    </>
  );
};

export default App;