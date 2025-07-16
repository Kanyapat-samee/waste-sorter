from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image
import io

app = Flask(__name__)
CORS(app)

model = tf.keras.models.load_model('model/savedmodel.keras')

class_names = {
    0: 'compostable',
    1: 'general',
    2: 'hazardous',
    3: 'recyclable'
}

def preprocess_image(file):
    img_bytes = file.read()
    img = image.load_img(io.BytesIO(img_bytes), target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array = tf.keras.applications.mobilenet_v3.preprocess_input(img_array)
    img_array = np.expand_dims(img_array, axis=0)
    return img_array

@app.route('/classify', methods=['POST'])
def classify():
    try:
        image_file = request.files.get('image')
        if not image_file:
            return jsonify({'error': 'No image uploaded'}), 400

        img_array = preprocess_image(image_file)
        prediction = model.predict(img_array)
        predicted_class = np.argmax(prediction, axis=1)[0]
        confidence = float(np.max(prediction))

        return jsonify({
            'class': class_names.get(predicted_class, "unknown"),
            'confidence': round(confidence, 4)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/')
def home():
    return 'Waste Sort Backend is running.'

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
