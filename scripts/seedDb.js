import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';
import User from '../models/User.js';
import ResumeTemplate from '../models/ResumeTemplate.js';

dotenv.config();

async function seedDatabase() {
  try {
    const MONGODB_URI =
      process.env.MONGODB_URI ||
      'mongodb://localhost:27017/ai-resume-tailor';

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await ResumeTemplate.deleteMany({});

    console.log('Cleared existing data');

    // Create admin user
    const salt = await bcryptjs.genSalt(10);
    const adminPassword = await bcryptjs.hash('admin123', salt);

    const admin = new User({
      email: 'admin@airesume.local',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      subscription: 'premium',
      tailoringsLimit: 1000,
      isActive: true,
    });

    await admin.save();
    console.log('Admin user created:', admin.email);

    // Create demo users
    const demoUserPassword = await bcryptjs.hash('demo123', salt);

    const demoUser1 = new User({
      email: 'demo@example.com',
      password: demoUserPassword,
      firstName: 'Demo',
      lastName: 'User',
      role: 'user',
      subscription: 'free',
      tailoringsLimit: 3,
      isActive: true,
    });

    await demoUser1.save();
    console.log('Demo user created:', demoUser1.email);

    // Create resume templates
    const templates = [
      {
        name: 'modern',
        description: 'Modern, clean resume template',
        structure: {
          sections: [
            'contactInfo',
            'headline',
            'professionalSummary',
            'coreSkills',
            'workExperience',
            'education',
            'certifications',
            'projects',
          ],
          fonts: {
            heading: 'Calibri',
            body: 'Calibri',
          },
          spacing: {
            sectionMargin: 12,
            lineHeight: 1.15,
          },
        },
        atsCompliant: true,
        format: 'single-column',
      },
      {
        name: 'classic',
        description: 'Classic, traditional resume template',
        structure: {
          sections: [
            'contactInfo',
            'headline',
            'professionalSummary',
            'coreSkills',
            'workExperience',
            'education',
          ],
          fonts: {
            heading: 'Times New Roman',
            body: 'Times New Roman',
          },
          spacing: {
            sectionMargin: 12,
            lineHeight: 1.15,
          },
        },
        atsCompliant: true,
        format: 'single-column',
      },
      {
        name: 'minimal',
        description: 'Minimalist resume template',
        structure: {
          sections: [
            'contactInfo',
            'headline',
            'coreSkills',
            'workExperience',
            'education',
            'projects',
          ],
          fonts: {
            heading: 'Arial',
            body: 'Arial',
          },
          spacing: {
            sectionMargin: 10,
            lineHeight: 1.0,
          },
        },
        atsCompliant: true,
        format: 'single-column',
      },
      {
        name: 'technical',
        description: 'Technical resume template (optimized for engineers)',
        structure: {
          sections: [
            'contactInfo',
            'headline',
            'coreSkills',
            'workExperience',
            'projects',
            'education',
          ],
          fonts: {
            heading: 'Calibri',
            body: 'Calibri',
          },
          spacing: {
            sectionMargin: 12,
            lineHeight: 1.15,
          },
        },
        atsCompliant: true,
        format: 'single-column',
      },
    ];

    await ResumeTemplate.insertMany(templates);
    console.log('Templates created:', templates.length);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
