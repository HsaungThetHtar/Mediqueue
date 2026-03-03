const mongoose = require('mongoose');
const Department = require('./models/Department');

const departments = [
  { name: 'Cardiology' },
  { name: 'Pediatrics' },
  { name: 'Neurology' },
  { name: 'Orthopedics' },
  { name: 'Dermatology' },
  { name: 'Oncology' },
  { name: 'Radiology' },
  { name: 'General Surgery' },
  { name: 'Ophthalmology' },
  { name: 'ENT' }
];

mongoose.connect('mongodb+srv://67011690_db_user:JdrzjbCt0IFWMMLP@cluster0.xkfbjyj.mongodb.net/?appName=Cluster0', {
  
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    console.log('Connected to MongoDB');
    await Department.deleteMany({});
    await Department.insertMany(departments);
    console.log('Departments seeded successfully!');
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });
