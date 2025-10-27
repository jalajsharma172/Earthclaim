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
import {UpdateMintedPolygon} from "@shared/UpdateMintedPolygon";

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

      const path= await clearUserPath(username)
      if(path.success==true){
        res.status(200).json({
        message: 'Paths deleted successfully',
      });
      }else{
        res.status(500).json({
        message: 'Path is Not Deleted Successfully'
      });
      }
      

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
    const { username, polygonName, polygons } = req.body;

    // Fixed variable name - changed 'polygon' to 'polygons'
    if (!username || !polygonName || !polygons) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: username, polygonName, or polygons"
      });
    }

    console.log("Server side Name :: ", username);

    // Handle IPFS error handling
    const IPFS = await uploadJsonToIPFS(polygons);
    console.log("IPFS : ", IPFS);
    
    if (IPFS === "Error") {
      return res.status(500).json({
        success: false,
        message: "IPFS upload failed"
      });
    }

    // Convert from [{lat, lng}, ...] → [ [lng, lat], ... ]
    // Fixed: using 'lng' instead of 'lon'
    const coords = polygons.map(p => [p.lng, p.lat]);
    
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
    console.log(username, polygonName, areaInSqMeters, IPFS);
    
    // Save to database
    const polygonstatus = await savePolygon(username, polygonName, areaInSqMeters, IPFS);
    
    if (polygonstatus.success === true) {      
      return res.status(200).json({
        success: true,
        message: "Polygon saved to database successfully",
        totalArea_m2: areaInSqMeters,
        IPFS: IPFS,
      });
    } else {
      console.error("Can't save polygon to db:", polygonstatus.error);
      return res.status(500).json({
        success: false,
        message: polygonstatus.message || "Failed to save polygon to database",
        error: polygonstatus.error
      });
    }

  } catch (error) {
    console.error("Error in /api/save-polygons:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});



// minted ==true; and set transaction hash
app.post("/api/update-polygon-minted", async (req, res) => {
  const { username, nft } = req.body;
  console.log("API : /api/update-polygon-minted");
  console.log(username);
  console.log(nft);
  
  if (!username || !nft ) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: username, nft, or transactionHash"
    });
  }
  try {
    console.log("Server On Updateminted polygon");
    
   const polygonstatus=await UpdateMintedPolygon(username, nft);
   console.log(polygonstatus);
   
   if(polygonstatus.success==true){
      return res.status(200).json({
        success: true,
        message: "Polygon minted status updatedsuccessfully"
      });
   }else{
      return res.status(400).json({
        success: false,
        message: "Polygon is not pdatedsuccessfully"
      });
   }

  } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Polygon minted status not updatedsuccessfully"
      });
  }


  

});


app.post("/api/get-nfts", async (req, res) => {
  try {    
    const { username } = req.body; 
    
    if(!username){
      console.log("Username is missing or empty - returning 400");
      return res.status(400).json({
        success: false, 
        message:'No UserName found at API Body'
      });
    }
    // Get JSON From 'UserPolygon' Table - AWAIT the promise
    const data = await getPolygonJSON(username);
    
    if(data){
      res.status(200).json({
        success: true,
        status: true,
        data: data
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


app.post("/api/send-msg", async (req: Request, res: Response) => {
  try {
    const { recipient, tokenURI, tokenId } = req.body;
    console.log("Received token info:", { tokenId, tokenURI, recipient });
    const text = `A new NFT has been minted!\nToken ID: ${tokenId}\nRecipient: ${recipient}\nToken URI: ${tokenURI}`;
    console.log(text);
    
     let telegramResult: any = null;
    try {
      telegramResult = await sendTelegramMessage(text);
      if(telegramResult.success==true){
        return res.json({
          
          success: true,
          message: "Messege Send at telegram . ",

        })
      }else{
      return res.json({
          success: false,
          message: "Messege not Send at telegram .",

        })
      }
    } catch (tgErr) {
      console.error("Failed to send Telegram message:", tgErr);
      // do not throw - continue to persist token info; include error in response
    }


    
        if(telegramResult.success==true){
          return res.status(200).json({
            success: true,
            message: "TokenInfo Saved .",
            recipient:recipient,
            tokenURI:tokenURI,
            tokenId:tokenId,
            data:telegramResult
          });
        }else{
          
          return res.status(500).json({
            success: false,
            message: "TokenInfo Not Saved .",
            recipient:recipient,
            tokenURI:tokenURI,
            tokenId:tokenId,
            data:telegramResult
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