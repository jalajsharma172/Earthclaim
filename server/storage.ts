 
import { loginSchema } from "@shared/schema";
import { sql } from "drizzle-orm";

// Function to create a new user
export async function createUser(userData: { username: string; useremail: string }) {
  try {
    // await db.insert(loginSchema).values(userData);
    return { success: true, message: "User created successfully" };
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error("Failed to create user");
  }
}

// Function to fetch all users
export async function getUsers() {
  try {
    // const users = await db.select().from(loginSchema);
    // return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error("Failed to fetch users");
  }
}

// UserName
export async function checkUserExist(username:String) {
  try {
    // const users = await db.select().from(loginSchema);
    // return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error("Failed to fetch users");
  }
}