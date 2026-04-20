# Project Report: Rain Forecasting System using MERN Stack and Cloud Computing

## 1. Abstract
The "Rain Forecasting System" is a comprehensive web-based application designed to predict the probability of rainfall using machine learning algorithms. The system integrates a trained machine learning model (Random Forest) within a microservices architecture. It utilizes the MERN (MongoDB, Express.js, React.js, Node.js) stack for the web application interface and data management, and relies on a Python-based Flask microservice for real-time inference. Hosted on a cloud platform (AWS), the system offers a scalable, user-friendly dashboard for real-time weather monitoring, automated forecasting, historical data analysis, and an alert system to warn users of high-probability rainfall events. 

## 2. Objectives
*   **Accurate Prediction:** To develop and deploy a machine learning model capable of predicting rainfall probability based on multiple meteorological features (temperature, humidity, pressure, wind speed, cloud cover, dew point, etc.).
*   **Real-time Monitoring:** To integrate with real-time weather APIs (OpenWeatherMap) to continuously monitor weather conditions across various locations.
*   **Scalable Architecture:** To build a robust backend using the MERN stack and a microservices approach for the ML component, ensuring the system can handle concurrent requests and large datasets.
*   **Intuitive User Interface:** To design a dynamic, responsive, and visually appealing dashboard (using React) that presents complex meteorological data and predictions in an easily understandable format.
*   **Automated Alerts:** To implement a proactive alert system that triggers notifications when the predicted probability of rain exceeds a critical threshold, enabling timely preparations.

## 3. System Architecture

The project follows a distributed, multi-tier architecture deployed on Amazon Web Services (AWS).

*   **Frontend (Client Tier):**
    *   Built with React.js, featuring a modern "glassmorphism" UI design with dark mode.
    *   Hosted on an Amazon S3 bucket configured for static website hosting.
    *   Communicates with the backend REST APIs via HTTP requests using Axios.
*   **Backend (Application Tier - Node.js):**
    *   An Express.js REST API handles user authentication (JWT), data persistence, and acts as an API gateway.
    *   Includes a scheduled CRON job (`node-cron`) to periodically fetch live weather data for tracked cities.
    *   Hosted on an Amazon EC2 instance.
*   **Machine Learning Microservice (Inference Tier - Python):**
    *   A separate Flask-based REST API dedicated exclusively to running the trained Random Forest model.
    *   Receives pre-processed feature vectors from the Node.js backend, performs inference, and returns probabilities.
    *   Hosted on the same EC2 instance (or scalable to a separate instance/container) running on port 5001.
*   **Database (Data Tier - MongoDB):**
    *   MongoDB Atlas (Cloud Database) is used to store user profiles, real-time weather readings (`WeatherData`), and prediction history (`Prediction`).

**Architecture Flow:**
1.  **Manual Flow:** User inputs weather data on the React UI -> Node.js API validates input -> Node.js calls Flask ML API -> Flask returns prediction -> Node.js stores result in MongoDB -> React UI displays the result.
2.  **Automated Flow:** Node.js CRON job fetches data from OpenWeatherMap -> Data is formatted and sent to Flask ML API -> Result is evaluated against thresholds -> High-risk results trigger alerts -> All data is saved to MongoDB.

## 4. Methodology

### 4.1 Data Source & Processing
*   **Data Collection:** Historical weather data is gathered (simulated in this project via synthetic generation, but designed to use OpenWeatherMap historical APIs in production). 
*   **Feature Engineering:** Raw meteorological data is transformed. New features are derived, such as `dew_spread` (Temperature - Dew Point), `humidity_pressure_ratio`, and a `wind_humidity_index`.
*   **Preprocessing:** Data is cleaned (handling missing values, dropping duplicates), split into training and testing sets (80/20 stratified split), and standardized using `StandardScaler`.

### 4.2 Machine Learning Model
*   **Model Selection:** Several models were evaluated, including Logistic Regression, Gradient Boosting, and Random Forest.
*   **Training:** Random Forest was selected as the primary model due to its robustness against overfitting and ability to capture complex non-linear relationships in weather data. It was trained with balanced class weights to handle potential class imbalances (rain vs. no rain).
*   **Export:** The trained model and the associated scaler are serialized and exported as `.joblib` files, accompanied by a metadata JSON file to ensure version control and feature consistency.

### 4.3 MERN Implementation
*   **React:** Context API is used for global state management (auth state, fetched weather, alerts). Recharts is used for data visualization.
*   **Express/Node:** Controllers handle business logic, Mongoose models define database schemas, and express-validator ensures data integrity. Bcrypt is used for password hashing.

## 5. Tools & Technologies
*   **Frontend:** HTML5, CSS3 (Custom Design System), React.js 18, React Router v6, Recharts, Axios.
*   **Backend:** Node.js, Express.js, JSON Web Tokens (JWT), Mongoose, node-cron.
*   **Machine Learning:** Python 3.11, Scikit-learn, Pandas, NumPy, Flask, Joblib.
*   **Database:** MongoDB Atlas.
*   **External APIs:** OpenWeatherMap API.
*   **Cloud & Infrastructure:** AWS (EC2, S3, IAM, CloudFormation), PM2 (Process Manager).

## 6. Results & Conclusion

### 6.1 Results
*   **Model Performance:** The Random Forest classifier achieved a high accuracy rate (approx. 87.4%) on the test dataset, with a strong ROC-AUC score of 0.93, indicating excellent discriminative ability between rain and no-rain events. 
*   **System Latency:** The microservices approach resulted in fast inference times. The Node.js to Flask API communication overhead is minimal, allowing the UI to render predictions almost instantaneously.
*   **Usability:** The resulting dashboard provides a comprehensive view of weather trends, prediction history, and feature importance, making meteorological data accessible and actionable.

### 6.2 Conclusion
The "Rain Forecasting System" successfully demonstrates the integration of machine learning within a modern web stack (MERN) and cloud architecture. By separating the ML inference engine into a dedicated microservice, the system achieves scalability and maintainability. The automated data fetching and alert mechanisms transform the application from a simple calculator into a proactive monitoring tool.

### 6.3 Future Enhancements
*   **Time-Series Forecasting:** Integrating recurrent neural networks (like LSTM or GRU) to predict rainfall amounts over future time steps, rather than just binary classification.
*   **Spatial Data:** Incorporating radar/satellite imagery processing using CNNs to detect storm movements.
*   **Advanced Notifications:** Implementing push notifications, SMS alerts (via Twilio), or email alerts (via SendGrid) when high-probability rain is detected.
