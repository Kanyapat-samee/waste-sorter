# base image
FROM python:3.10-slim

# set working directory
WORKDIR /app

# copy requirements first (if you have one)
COPY requirements.txt .

# install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# copy source code
COPY . .

# expose the port Flask will run on
EXPOSE 5000

# run the app
CMD ["python", "app.py"]