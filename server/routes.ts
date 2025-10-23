import type { Express, Request, Response } from "express";
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
import {deletePolygon} from "@shared/delete_Polygon"
import { detectClosedLoopsHandler } from "./loop_detection.ts";
import {getPolygonJSON} from "@shared/Get_Polygons.ts"
import { responseEncoding } from "axios";
import {TokenInfo} from "@shared/TokenInfo.ts" 
import axios from "axios"; 
import sendTelegramMessage from "./Social_Media_Updates/TelegramMsgUpdate.ts";

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
      const {username,polygonName,polygons } = req.body;

      if(!username || !polygonName || !polygon){
        return res.status(404).json({
          mmessage: "Unable to get info from api "
        })
      }

      console.log("Servser side Name   ::  ",username);
      
 //HNADLE ipfs ERROR HADLIng
      
      const IPFS=await uploadJsonToIPFS(polygons);
      console.log("IPFS  : ",IPFS);
      if(IPFS=="Error"){
         return res.status(401).json({
          success: false,
          message: "IPFS is not working"
        });
      }
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
    console.log(username,polygonName,areaInSqMeters,IPFS);
    
    const polygonstatus=await savePolygon(username,polygonName,areaInSqMeters,IPFS)
    if(polygonstatus.success==true){
      
      
      // Clear UserPath Db.
       
      
      
      
      return res.status(200).json({
        success: true,
        message: "Polygon Saved Db successfully",
        totalArea_m2: areaInSqMeters,
        IPFS,
      });






   }else{
   
      return res.status(200).json({
        success: false,
        message: await polygonstatus.message,
        totalArea_m2: areaInSqMeters,
        IPFS,
      });
    }
    
      
    } catch (error) {
      console.error('Error fetching paths:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error at server side api',
        polygon:[]
      });
    }
  });



app.post("/api/get-nfts", async (req, res) => {
  try {
    console.log("=== /api/get-nfts endpoint called ===");
    console.log("Request method:", req.method);
    console.log("Request headers:", req.headers);
    console.log("Request body:", req.body);
    console.log("Request body type:", typeof req.body);
    console.log("Request body keys:", Object.keys(req.body || {}));
    
    const { username } = req.body;
    console.log("Extracted username:", username);
    console.log("Username type:", typeof username);
    console.log("Username truthy check:", !!username);
    
    if(!username){
      console.log("Username is missing or empty - returning 400");
      return res.status(400).json({
        success: false, 
        message:'No UserName found at API'
      });
    }
    // Get JSON From 'UserPolygon' Table - AWAIT the promise
    const result = await getPolygonJSON(username);

 
 
    // For clarity, extract the properties if present
    const nftJson = result.JSON || null;
    const msg = result.message || 'No data available';

    console.log('NFT JSON data:', nftJson);
    
    if(nftJson){
      res.status(200).json({
        success: true,
        status: true,
        JSON: nftJson
      });
    }else{
      res.status(404).json({
        success: false,
        status: false,
        message: 'No NFT data found for user'
      });
    }    
 
  } catch (error) { 
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error 
    });
  }
});


  app.delete("/api/delete-userpath",async (req,res) => {
  try {
      const {username } = req.body;

      if(!username  ){
        return res.status(200).json({
          mmessage: "Unable to get info from api "
        })
      }

      console.log("Servser side Name   ::  ",username);
         
    
    // const saveToDb
    const polygonstatus=await clearUserPath(username)
    if(polygonstatus.success==true){
      return res.status(200).json({
        success: true,
        message: "Polygon delete from  Db successfully"
      });
   }else{
   
      return res.status(200).json({
        success: false
      });
    }
    
      
    } catch (error) {
      console.error('Error fetching paths:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error at server side api',
       });
    }
  })




app.post("/api/tokeninfo", async (req: Request, res: Response) => {
  try {
    const { recipient, tokenURI, tokenId } = req.body;
    console.log("Received token info:", { tokenId, tokenURI, recipient });
    const text = `A new NFT has been minted!\nToken ID: ${tokenId}\nRecipient: ${recipient}\nToken URI: ${tokenURI}`;
    console.log(text);
    
     let telegramResult: any = null;
    try {
      telegramResult = await sendTelegramMessage(text);
      console.log("Telegram message sent:", telegramResult);
    } catch (tgErr) {
      console.error("Failed to send Telegram message:", tgErr);
      // do not throw - continue to persist token info; include error in response
    }


    const tokeninfo =await TokenInfo(recipient,tokenURI,tokenId);
        if(tokeninfo.success==true){
          return res.status(200).json({
            success: true,
            message: "TokenInfo Saved .",
            recipient:recipient,
            tokenURI:tokenURI,
            tokenId:tokenId,
            data:tokeninfo
          });
        }else{
          
          return res.status(500).json({
            success: false,
            message: "TokenInfo Not Saved .",
            recipient:recipient,
            tokenURI:tokenURI,
            tokenId:tokenId,
            data:tokeninfo
          });
        }
     
  } catch (error) {
    console.error("Error in /api/tokeninfo:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});


// Adjust this new api to send Msg directly.
app.post("api/send-msg",async (req:Request,res:Response) => {
      const { recipient, tokenURI, tokenId } = req.body;
    console.log("Received token info:", { tokenId, tokenURI, recipient });
    const text = `A new NFT has been minted!\nToken ID: ${tokenId}\nRecipient: ${recipient}\nToken URI: ${tokenURI}`;
    await sendTelegramMessage(text);
})













  
app.post('/api/detect-loops', async(req, res) => {
    // Let detectClosedLoopsHandler handle sending the response
    try {
      
      
      const detect= detectClosedLoopsHandler(req, res);
      console.log(detect);
       
    } catch (err) {
      console.log('Error in detection python file ',err);
      
    }
});

app.post('/api/save-address',async (req,res) => {
  const {Address,username}=req.body;
  if(!Address || !username){
    console.log("Not reviced Address & UserName");
    return res.json({
      status:false,
      message: "No Address / UserName found "
    });
  }else{
    
  }
})

  const httpServer = createServer(app);
  return httpServer;
}