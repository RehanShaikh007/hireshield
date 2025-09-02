import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const bootstrapSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: "super_admin" });

    if (existingSuperAdmin) {
      console.log("Super admin already exists:", existingSuperAdmin.email);
      process.exit(0);
    }

    // Create super admin user
    const superAdminData = {
      username: process.env.SUPER_ADMIN_USERNAME,
      email: process.env.SUPER_ADMIN_EMAIL,
      password: process.env.SUPER_ADMIN_PASSWORD,
      firstName: process.env.SUPER_ADMIN_FIRST_NAME,
      lastName: process.env.SUPER_ADMIN_LAST_NAME,
      role: "super_admin",
      isActive: true,
    };

    const superAdmin = new User(superAdminData);
    await superAdmin.save();

    console.log("✅ Super admin created successfully!");
    console.log("📧 Email:", superAdminData.email);
    console.log("🔑 Password:", superAdminData.password);
    console.log("⚠️  Please change the password after first login!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating super admin:", error);
    process.exit(1);
  }
};

// Run the bootstrap script
bootstrapSuperAdmin();
