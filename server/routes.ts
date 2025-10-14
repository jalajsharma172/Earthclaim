import type { Express } from "express";
import { createServer, type Server } from "http";
import { BrowserStorageService,SuprabaseStorageService} from "@shared/login";
import { loginSchema ,userpathSchema} from "@shared/schema";
import { z } from "zod";
import {upsertUserPath} from '@shared/Save_Path'
import {clearUserPath} from '@shared/Delete_Path'
import {getUserPathByUsername} from '@shared/Get_Path'
import {savePolygon} from "@shared/Save_Polygon"

// In-memory storage for paths (replace with database in production)
let pathStorage: Array<{
  id: string;
  path: string;
  createdAt: string;
}> = [];

// Helper function to generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
  // API to Login paths
export async function registerRoutes(app: Express): Promise<Server> {

  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("Login request body:", req.body);
      const { useremail, username } = loginSchema.parse(req.body);
      
      let user;
      if (useremail && useremail.trim() !== "" ) {
        user = await SuprabaseStorageService(username,useremail);// check + new user register bhi kr dega .
      }   
      
      res.json({ user });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ message: "Server error", error: errorMessage });
      }
    }
  });

  // API to save paths
 app.post("/api/paths", async (req, res) => {
  try {
    const { username, paths } = req.body;

    // Validate input
    if (!username || !paths || !Array.isArray(paths)) {
      return res.status(400).json({
        success: false,
        message: "Username and paths are required.",
      });
    }

    console.log("Received username:", username, "and paths:", paths);

    // Call upsertUserPath to save data
    const result = await upsertUserPath(username, paths);

    if (result.success) {
      console.log("✅ Paths saved successfully for user:", username);
      res.status(201).json({
        success: true,
        message: "Paths saved successfully",
      });
    } else {
      console.error("❌ Failed to save paths for user:", username);
      res.status(500).json({
        success: false,
        message: "Failed to save paths to database",
      });
    }
  } catch (error) {
    console.error("Error in /api/paths:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

  // API to delete paths
  app.delete("/api/paths", async (req, res) => {
    try {
       const {username } = req.body;
    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required.",
      });
    }

      const success=clearUserPath(username)
   
      res.status(200).json({
        // success: success,
        message: 'Paths deleted successfully',
      });

    } catch (error) {
      console.error('Error deleting paths:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  // Additional API to get all paths (optional)
  app.get("/api/paths", async (req, res) => {
    try {
      const {username } = req.body;
      console.log("Servser side Name   ::  ",username);
      
      const  getUserPath=await getUserPathByUsername(username);

      res.json(
        getUserPath
      );
    } catch (error) {
      console.error('Error fetching paths:', error);
      res.status(500).json({
        success: false,
        path:[],
        message: 'Internal server error'
      });
    }
  });

  app.post("/api/save-polygons", async (req, res) => {
  try {
    const { username, polygons } = req.body;
    
    if (!username || !polygons || !Array.isArray(polygons)) {
      return res.status(400).json({
        success: false,
        message: 'Username and polygons array are required'
      });
    }
    console.log("--------------------------------------------------------------------------");
    console.log(username);
    console.log(polygons);
    console.log("--------------------------------------------------------------------------");
    
    savePolygon(username,polygons);
    // const { data, error } = await supabase
    //   .from('UserPath')
    //   .upsert({
    //     UserName: username,
    //     polygons: polygons, // This will be stored as JSONB[]
    //     updated_at: new Date().toISOString()
    //   }, {
    //     onConflict: 'UserName'
    //   })
    //   .select();

    // if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Polygons saved successfully',
      polygons: polygons.map(p => ({ name: p.name, points: p.points.length }))
    });

  } catch (error) {
    console.error('Error saving polygons:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save polygons'
    });
  }
});


  const httpServer = createServer(app);
  return httpServer;
}



  


 