const mongoose = require('mongoose');
const dotenv = require('dotenv');
const WeatherData = require('./models/WeatherData');
const Prediction = require('./models/Prediction');

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rain_forecasting';

const CITIES = ['Mumbai', 'Delhi', 'Chennai', 'Kolkata', 'Bangalore', 'Pune', 'Surat'];

async function seedData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB!');

    console.log('Clearing old mock data...');
    await WeatherData.deleteMany({});
    await Prediction.deleteMany({});

    console.log('Generating mock weather and predictions...');

    const weatherDocs = [];
    const predictionDocs = [];

    // Generate data for the last 7 days
    for (let i = 7; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      for (const city of CITIES) {
        // Random weather features
        const features = {
          temperature_c: (20 + Math.random() * 15).toFixed(2),
          humidity_pct: Math.floor(40 + Math.random() * 50),
          pressure_hpa: Math.floor(1000 + Math.random() * 20),
          wind_speed_kmh: (5 + Math.random() * 20).toFixed(2),
          wind_direction_deg: Math.floor(Math.random() * 360),
          cloud_cover_pct: Math.floor(Math.random() * 100),
          dew_point_c: (15 + Math.random() * 10).toFixed(2),
          visibility_km: 10,
          uv_index: Math.floor(Math.random() * 10),
          temp_change_3h: 0,
          pressure_change_3h: 0,
          month: date.getMonth() + 1
        };

        // 1. Add Weather Data
        weatherDocs.push({
          city: city,
          country: 'IN',
          coordinates: { lat: 19.07, lon: 72.87 }, // Dummy coords
          features: features,
          weather_description: features.cloud_cover_pct > 70 ? 'cloudy' : 'clear sky',
          icon_code: features.cloud_cover_pct > 70 ? '04d' : '01d',
          source: 'mock_seed',
          fetchedAt: date
        });

        // 2. Add Prediction Data
        const prob = Math.random();
        // Make heavy rain more likely in Mumbai/Chennai for realism
        const isCoastal = city === 'Mumbai' || city === 'Chennai';
        const finalProb = isCoastal ? Math.min(prob + 0.2, 1) : prob;

        let severity = 'No Rain Expected';
        let advice = 'Enjoy the clear weather!';
        if (finalProb >= 0.85) {
          severity = 'Heavy Rain';
          advice = 'Flooding possible. Stay indoors and avoid travel.';
        } else if (finalProb >= 0.5) {
          severity = 'Light Rain';
          advice = 'Carry an umbrella.';
        }

        predictionDocs.push({
          city: city,
          inputFeatures: features,
          result: {
            will_rain: finalProb >= 0.5,
            probability: parseFloat(finalProb.toFixed(4)),
            rain_chance: `${(finalProb * 100).toFixed(1)}%`,
            confidence: finalProb > 0.8 || finalProb < 0.2 ? 'High' : 'Medium',
            severity: severity,
            advice: advice
          },
          model_version: '1.0.0-mock-seed',
          source: 'auto',
          predictedAt: date
        });
      }
    }

    // Insert into DB
    await WeatherData.insertMany(weatherDocs);
    await Prediction.insertMany(predictionDocs);

    console.log(`✅ Successfully inserted ${weatherDocs.length} Weather records!`);
    console.log(`✅ Successfully inserted ${predictionDocs.length} Prediction records!`);

  } catch (err) {
    console.error('❌ Error seeding data:', err);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seedData();
