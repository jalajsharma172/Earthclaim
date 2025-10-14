import type { Express } from "express";
import { createServer, type Server } from "http";
import { BrowserStorageService,SuprabaseStorageService} from "@shared/login";
import { loginSchema ,userpathSchema} from "@shared/schema";
import { z } from "zod";
import {upsertUserPath} from '@shared/Save_Path'
import {clearUserPath} from '@shared/Delete_Path'
import {getUserPathByUsername} from '@shared/Get_Path'
import {savePolygon} from "@shared/Save_Polygon"
import {uploadJsonToIPFS} from "./uploafToIPFS"; 
import { polygon } from "@turf/helpers";
import area from "@turf/area";//Area calculator
import { Position } from "geojson";
import {UserPolygon} from '@shared/schema'

 
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
// POST API to save polygons to UserPolygon table

  // Additional API to get all paths (optional)
  app.post("/api/save-polygons", async (req, res) => {
    try {
      const {username,polygons } = req.body;

      console.log("Servser side Name   ::  ",username);
      
 //HNADLE ipfs ERROR HADLIng
      const IPFS=await uploadJsonToIPFS(polygon);
      console.log("IPFS  : ",IPFS);

      // Convert from [{lat, lon}, ...] → [ [lon, lat], ... ]
    const coords = polygons.map(p => [p.lon, p.lat]);
        // Close polygon loop (important for Turf)
    if (coords.length > 0 && 
        (coords[0][0] !== coords[coords.length - 1][0] || 
         coords[0][1] !== coords[coords.length - 1][1])) {
      coords.push(coords[0]);
    }
    // Compute area using Turf (in square meters)
    const turfPolygon = polygon([coords]);
    const areaInSqMeters = area(turfPolygon);
       
    console.log("Polygon Area (m²):", areaInSqMeters);

    
    // const saveToDb

    return res.status(200).json({
    success: true,
    message: "Polygon Saved Db successfully",
    totalArea_m2: areaInSqMeters,
    IPFS,
  });
 
      
    } catch (error) {
      console.error('Error fetching paths:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error at server side api',
        polygon:[]
      });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}