import React, { useState, useEffect } from "react";
const API_URL = import.meta.env.VITE_SUBMIT_FEEDBACK_URL;

const ResultPanel = ({ result, loading }) => {
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [actualClass, setActualClass] = useState("");

  useEffect(() => {
    setFeedbackGiven(false);
    setIsCorrect(null);
    setActualClass("");
  }, [result]);

  const sendFeedback = async (isCorrectValue, correctedClassValue = null) => {
    if (!result?.class) return;

    const payload = {
      predictedClass: result.class,
      isCorrect: isCorrectValue,
      correctedClass: correctedClassValue,
      timestamp: new Date().toISOString(),
    };

    try {
      await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      console.log("Feedback sent:", payload);
    } catch (err) {
      console.error("Failed to send feedback:", err);
    }
  };

  const getBinInfo = (wasteClass) => {
    const mapping = {
      general: {
        color: "Blue bin",
        desc: `This item is classified as general waste, which includes materials that are difficult to decompose, not suitable for composting, and not economically viable to recycle. 
        Examples include snack wrappers, used tissue paper, plastic packaging contaminated with food, foam food containers, coated paper cups, broken tiles, glass shards, and miscellaneous construction debris. 
        These items should be disposed of in the blue bin, which is specifically designed for non-recyclable, non-organic waste.`,
      },
      compostable: {
        color: "Green bin",
        desc: `This item falls under compostable or organic waste. It includes biodegradable materials commonly generated from households, restaurants, markets, or agriculture. 
        Typical examples are food scraps, vegetable and fruit peels, animal waste, leaves, twigs, and other natural materials that break down easily. 
        The green bin is meant for these items, helping convert them into compost or animal feed, thus supporting a sustainable waste cycle.`,
      },
      recyclable: {
        color: "Yellow bin",
        desc: `This item is recyclable waste, which refers to materials that can be processed and reused to reduce the consumption of raw resources. 
        Examples include plastic bottles, aluminum cans, glass containers, rubber tires, UHT cartons, cardboard, and various metals or plastics from manufacturing. 
        Recyclables should be disposed of in the yellow bin to allow proper sorting and recycling, which supports environmental sustainability and resource recovery.`,
      },
      hazardous: {
        color: "Red bin",
        desc: `This item is considered hazardous waste. It contains substances that can be toxic, flammable, corrosive, or otherwise dangerous to people, animals, or the environment. 
        Such waste includes batteries, fluorescent bulbs, paint cans, pesticides, spray bottles, old electronics, and medical items like syringes or used masks. 
        These must be disposed of in the red bin to prevent environmental contamination and ensure safe handling and treatment of dangerous materials.`,
      },
    };

    return mapping[wasteClass] || {
      color: "Unknown bin",
      desc: "No disposal guidance available for this classification.",
    };
  };

  const bin = result && getBinInfo(result.class);

  return (
    <div className="classify-right">
      <h2>AI Classification Result</h2>

      {loading ? (
        <p>Classifying image...</p>
      ) : result ? (
        <div className="result-content">
          <p><strong>Classification:</strong> {result.class}</p>
          <p><strong>Recommended bin:</strong> {bin.color}</p>
          <p style={{ marginTop: "1em", lineHeight: "1.6" }}>{bin.desc}</p>

          {!feedbackGiven ? (
            <div className="feedback-buttons" style={{ marginTop: "1.5em" }}>
              <p><strong>Was this classification correct?</strong></p>
              <div style={{ display: "flex", gap: "1em", marginTop: "0.5em" }}>
                <button
                  className="correct"
                  onClick={() => {
                    setIsCorrect(true);
                    setFeedbackGiven(true);
                    setActualClass(result.class);
                    sendFeedback(true, result.class);
                  }}
                >
                  Correct
                </button>
                <button
                  className="wrong"
                  onClick={() => {
                    setIsCorrect(false);
                    setFeedbackGiven(true);
                  }}
                >
                  Wrong
                </button>
              </div>
            </div>
          ) : isCorrect === false ? (
            <div className="correction-form" style={{ marginTop: "1.5em" }}>
              <p><strong>Please select the correct category:</strong></p>
              <select
                id="actual-class"
                value={actualClass}
                onChange={(e) => {
                  const selected = e.target.value;
                  setActualClass(selected);
                  sendFeedback(false, selected);
                }}
                className="feedback-select"
                style={{ marginTop: "0.5em" }}
              >
                <option value="">-- Select --</option>
                <option value="general">General</option>
                <option value="compostable">Compostable</option>
                <option value="recyclable">Recyclable</option>
                <option value="hazardous">Hazardous</option>
              </select>
              {actualClass && (
                <p style={{ marginTop: "1em" }}>
                  ✅ Thank you! Feedback received: <strong>{actualClass}</strong>
                </p>
              )}
            </div>
          ) : (
            <p style={{ marginTop: "1em" }}>✅ Thank you for confirming!</p>
          )}
        </div>
      ) : (
        <p>Waiting for image upload...</p>
      )}
    </div>
  );
};

export default ResultPanel;