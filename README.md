# Waste Sorter

Waste Sorter is a web application that helps users classify waste types using image recognition. Users can upload or capture images of trash, and the system will predict the appropriate waste category and recommend the correct disposal bin.

## Features

* Upload or capture waste images via webcam
* Classify waste into 4 categories: General, Compostable, Recyclable, Hazardous
* Suggest the correct waste bin color
* Feedback system for user corrections
* Frontend built with React and Vite
* Backend built with Flask and TensorFlow
* Docker-ready backend for easy deployment

## Frontend

### Tech Stack

* React
* Vite
* CSS Modules

### Run Locally

```bash
cd frontend
npm install
npm run dev
```

## Backend

### Tech Stack

* Python 3.10
* Flask
* TensorFlow / Keras
* Pillow, NumPy
* Docker

### Endpoints

* `POST /classify`: Accepts image (form-data), returns predicted class
* `POST /submit-feedback`: Accepts user feedback for model improvement

### Run Locally

```bash
cd backend
pip install -r requirements.txt
python app.py
```

## Project Structure

```
waste-sorter/
├── backend/
│   ├── app.py
│   ├── predict.py
│   ├── model/
│   ├── requirements.txt
│   └── Dockerfile

├── frontend/
│   ├── src/
│   ├── public/
│   └── vite.config.js
```