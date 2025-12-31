import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
// import { BrowserStorageService, SuprabaseStorageService } from "../shared/login.js";
// import { loginSchema, userpathSchema } from "../shared/schema.js";
// import { z } from "zod";
// import { upsertUserPath } from '../shared/Save_Path.js';
// import { clearUserPath } from '../shared/Delete_Path.js';
// import { getUserPathByUsername } from '../shared/Get_Path.js';
// import { savePolygon } from "../shared/Save_Polygon.js";
// import { uploadJsonToIPFS } from "./uploafToIPFS.js";
// import { polygon } from "@turf/helpers";
// import area from "@turf/area";
// import { Position } from "geojson";
// import { EventListner_MintedToken_Save } from '../shared/Event_MintedToken.js';
// import { deletePolygon } from "../shared/delete_Polygon.js";
// import { detectClosedLoopsHandler } from "./loop_detection.js";
import { getFreePolygon, getFreePolygonsFromWalletAddress, SaveFreePolygon } from "../shared/Get_Polygons.js";
// import { responseEncoding } from "axios";
// import { TokenInfo } from "../shared/TokenInfo.js";
// import axios from "axios";
// import { sendTelegramMessage } from "./Social_Media_Updates/TelegramMsgUpdate.js";
// import fetchTokenURI from "../shared/fetchTokenURI.js";
import { getTokenId } from "../shared/Get_ID.js";
// import { ethers } from "ethers";
// import { saveLocationToSupabase } from "../shared/SaveCooridnates.js"; // Note: Filename has typo
// import { getAllSaveLocations } from "../shared/getAllSaveLocations.js";
// import { processAndUpdateAllLocations } from "../shared/processSaveLocations.js";
// import { formatTodayWeather, getWeatherDescription } from "./getWeatherDescription.js";
// import { saveWeatherReport } from "../shared/saveWeatherReport.js";
// import { getTop3Rewards } from "../shared/getTop3Rewards.js";
import { FREE_POLYGONS } from "./freePolygons.js";
// import { getSupabaseClient } from "../shared/supabaseClient.js";
import multer from "multer";
import { uploadFileToIPFS } from "./uploadFileToIPFS.js";

const upload = multer({ storage: multer.memoryStorage() });




// API to Login paths
export async function registerRoutes(app: Express): Promise<Server> {

  // API to upload file to IPFS
  // app.post("/api/upload-ipfs", upload.single("image"), async (req, res) => {
  //   try {
  //     if (!req.file) {
  //       return res.status(400).json({ success: false, message: "No file uploaded" });
  //     }

  //     console.log("Uploading file to IPFS...", req.file.originalname);
  //     const ipfsHash = await uploadFileToIPFS(req.file);
  //     const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

  //     res.json({
  //       success: true,
  //       ipfsHash,
  //       ipfsUrl
  //     });
  //   } catch (error) {
  //     console.error("IPFS Upload Error:", error);
  //     res.status(500).json({ success: false, message: "Failed to upload to IPFS", error: String(error) });
  //   }
  // });

  // API to upload JSON metadata to IPFS
  // app.post("/api/upload-metadata", async (req, res) => {
  //   try {
  //     const { name, description, image } = req.body;

  //     if (!name || !description || !image) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "Missing metadata fields: name, description, or image"
  //       });
  //     }

  //     const metadata = { name, description, image };
  //     console.log("Uploading metadata to IPFS...", metadata);

  //     const ipfsHash = await uploadJsonToIPFS(metadata);

  //     if (ipfsHash === "Error" || !ipfsHash) {
  //       throw new Error("Failed to upload metadata to IPFS");
  //     }

  //     const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

  //     res.json({
  //       success: true,
  //       ipfsHash,
  //       ipfsUrl,
  //       metadata
  //     });
  //   } catch (error) {
  //     console.error("Metadata Upload Error:", error);
  //     res.status(500).json({ success: false, message: "Failed to upload metadata", error: String(error) });
  //   }
  // });

  app.get("/api/dummmy", (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Dummy Data"
    })
  })

  app.post("/api/dummmy", (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Dummy Data"
    })
  })


  app.get("/api/free-polygons", (req, res) => {
    // Return static data from server-side file instead of DB call
    console.log("Serving static free polygons.");
    return res.status(200).json(FREE_POLYGONS);
  });



  // API to SAVE free polygons 
  app.post("/api/free-polygons", async (req, res) => {
    try {
      const { ip, wallet, coordinates, name } = req.body;

      if (!ip || !wallet || !coordinates || !name) return res.status(400).json({
        success: false,
        message: "Missing required fields: ip, wallet, coordinates or name"
      });
      const data = await SaveFreePolygon(wallet, ip, coordinates, name);
      if (data) {
        return res.status(200).json({
          success: true,
          message: "Data received successfully",
          data: data
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Data not received successfully"
        });
      }

      res.json({
        success: true,
        message: "Data received successfully",
        data: data
      });
    } catch (error) {
      console.error("Error in /api/save-generated-polygon:", error);
      res.status(500).json({ success: false, message: "Server error", error: error });
    }
  });

  // get your Free NFTs
  app.post("/api/dashboard_free_nfts", async (req, res) => {
    try {
      const { walletAddress } = req.body;

      if (!walletAddress) {
        console.log("Username is missing or empty - returning 400");
        return res.status(400).json({
          success: false,
          message: 'No UserName found at API Body'
        });
      }
      const data = await getFreePolygonsFromWalletAddress(walletAddress);
      // console.log("data", data);
      if (data.success) {
        res.status(200).json({
          success: true,
          status: true,
          data: data.data
        });
      } else {
        res.status(404).json({
          success: false,
          data: data,
          status: false
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



  // app.post("/api/get-id", async (req, res) => {
  //   try {
  //     const { tokenURI } = req.body;
  //     console.log("Received token info:", { tokenURI });
  //     const tokenID = await getTokenId(tokenURI);
  //     if (tokenID.success == true) {
  //       return res.status(200).json({
  //         success: true,
  //         message: "Token ID fetched successfully .",
  //         tokenID: tokenID.tokenID
  //       });
  //     } else {
  //       return res.status(500).json({
  //         success: false,
  //         message: "Token ID Not fetched .",
  //         tokenID: tokenID.tokenID
  //       });
  //     }
  //   } catch (err) {
  //     console.log("Error is at server ", err);
  //     return res.status(500).json({
  //       success: false,
  //       message: "Server Error in fetching Token ID .",
  //     });
  //   }
  // })




  const httpServer = createServer(app);
  return httpServer;
}

