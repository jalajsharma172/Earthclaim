import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { BrowserStorageService, SuprabaseStorageService } from "../shared/login.js";
import { loginSchema, userpathSchema } from "../shared/schema.js";
import { z } from "zod";
import { upsertUserPath } from '../shared/Save_Path.js';
import { clearUserPath } from '../shared/Delete_Path.js';
import { getUserPathByUsername } from '../shared/Get_Path.js';
import { savePolygon } from "../shared/Save_Polygon.js";
import { uploadJsonToIPFS } from "./uploafToIPFS.js";
import { polygon } from "@turf/helpers";
import area from "@turf/area";
import { Position } from "geojson";
import { EventListner_MintedToken_Save } from '../shared/Event_MintedToken.js';
import { deletePolygon } from "../shared/delete_Polygon.js";
import { detectClosedLoopsHandler } from "./loop_detection.js";
import { getFreePolygon, getFreePolygonsFromWalletAddress, SaveFreePolygon } from "../shared/Get_Polygons.js";
import { responseEncoding } from "axios";
import { TokenInfo } from "../shared/TokenInfo.js";
import axios from "axios";
import { sendTelegramMessage } from "./Social_Media_Updates/TelegramMsgUpdate.js";
import fetchTokenURI from "../shared/fetchTokenURI.js";
import { getTokenId } from "../shared/Get_ID.js";
import { ethers } from "ethers";
import { saveLocationToSupabase } from "../shared/SaveCooridnates.js"; // Note: Filename has typo
import { getAllSaveLocations } from "../shared/getAllSaveLocations.js";
import { processAndUpdateAllLocations } from "../shared/processSaveLocations.js";
import { formatTodayWeather, getWeatherDescription } from "./getWeatherDescription.js";
import { saveWeatherReport } from "../shared/saveWeatherReport.js";
import { getTop3Rewards } from "../shared/getTop3Rewards.js";
import { FREE_POLYGONS } from "./freePolygons.js";
import { getSupabaseClient } from "../shared/supabaseClient.js";
import multer from "multer";
import { uploadFileToIPFS } from "./uploadFileToIPFS.js";

const upload = multer({ storage: multer.memoryStorage() });




// API to Login paths
export async function registerRoutes(app: Express): Promise<Server> {

  // API to upload file to IPFS
  app.post("/api/upload-ipfs", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      console.log("Uploading file to IPFS...", req.file.originalname);
      const ipfsHash = await uploadFileToIPFS(req.file);
      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

      res.json({
        success: true,
        ipfsHash,
        ipfsUrl
      });
    } catch (error) {
      console.error("IPFS Upload Error:", error);
      res.status(500).json({ success: false, message: "Failed to upload to IPFS", error: String(error) });
    }
  });

  // API to upload JSON metadata to IPFS
  app.post("/api/upload-metadata", async (req, res) => {
    try {
      const { name, description, image } = req.body;

      if (!name || !description || !image) {
        return res.status(400).json({
          success: false,
          message: "Missing metadata fields: name, description, or image"
        });
      }

      const metadata = { name, description, image };
      console.log("Uploading metadata to IPFS...", metadata);

      const ipfsHash = await uploadJsonToIPFS(metadata);

      if (ipfsHash === "Error" || !ipfsHash) {
        throw new Error("Failed to upload metadata to IPFS");
      }

      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

      res.json({
        success: true,
        ipfsHash,
        ipfsUrl,
        metadata
      });
    } catch (error) {
      console.error("Metadata Upload Error:", error);
      res.status(500).json({ success: false, message: "Failed to upload metadata", error: String(error) });
    }
  });


  app.get("/api/free-polygons", async (req, res) => {
    try {
      // Try fetching from DB first
      const dbPolygons = await getFreePolygon();

      // If DB returns data, use it. Otherwise, fallback to static list.
      if (dbPolygons && dbPolygons.length > 0) {
        return res.json(dbPolygons);
      }

      console.warn("DB returned no free polygons, using static fallback.");
      return res.json(FREE_POLYGONS);
    } catch (error) {
      console.error("Error fetching free polygons, using fallback:", error);
      // Fail safe: always return static data instead of crashing/timeout
      return res.json(FREE_POLYGONS);
    }
  });

  // API to SAVE free polygons 
  app.post("/api/save-generated-polygon", async (req, res) => {
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


  // app.post("/api/auth/login", async (req, res) => {
  //   try {
  //     console.log("Login request body:", req.body);
  //     const { useremail, username, walletAddress } = loginSchema.parse(req.body);

  //     let user;
  //     if (walletAddress || (useremail && useremail.trim() !== "")) {
  //       user = await SuprabaseStorageService(username, useremail, walletAddress);
  //     }

  //     res.json({ user });
  //   } catch (error) {
  //     console.error("Login error:", error);
  //     if (error instanceof z.ZodError) {
  //       res.status(400).json({ message: "Validation error", errors: error.errors });
  //     } else {
  //       const errorMessage = error instanceof Error ? error.message : "Unknown error";
  //       res.status(500).json({ message: "Server error", error: errorMessage });
  //     }
  //   }
  // });




  // app.post("/api/save-coordinates", async (req, res) => {
  //   try {
  //     const { username, latitude, longitude } = req.body;
  //     console.log(username, latitude, longitude);
  //     saveLocationToSupabase(username, latitude, longitude);
  //   } catch (err) {
  //     console.log("Error in saving ", err);
  //   }
  // })

  // app.post('/api/UpdateallCoordinates/WeatherReport', async (req, res) => {
  //   try {
  //     // get all data
  //     const data = await getAllSaveLocations();
  //     if (!data || data.length === 0) {
  //       return res.status(404).json({
  //         success: false,
  //         message: 'No locations found to update'
  //       });
  //     }

  //     const results = [];
  //     for (const location of data) {
  //       try {
  //         const response = await axios.get(`https://api.open-meteo.com/v1/forecast`, {
  //           params: {
  //             latitude: location.latitude,
  //             longitude: location.longitude,
  //             current_weather: true,
  //             hourly: 'temperature_2m,precipitation,weathercode',
  //             daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset',
  //             timezone: 'auto'
  //           }
  //         });

  //         const weatherReport = formatTodayWeather(response.data);
  //         const saveResult = await saveWeatherReport(location.username, weatherReport);

  //         results.push({
  //           username: location.username,
  //           success: saveResult.success,
  //           message: saveResult.message,
  //           weatherReport
  //         });
  //       } catch (error) {
  //         console.error(`Error processing location for ${location.username}:`, error);
  //         results.push({
  //           username: location.username,
  //           success: false,
  //           message: error instanceof Error ? error.message : 'Unknown error',
  //           weatherReport: null
  //         });
  //       }
  //     }

  //     const successCount = results.filter(r => r.success).length;
  //     res.json({
  //       success: true,
  //       totalProcessed: data.length,
  //       successfulUpdates: successCount,
  //       failedUpdates: data.length - successCount,
  //       results
  //     });

  //   } catch (err) {
  //     console.error("Error in updating Weather Reports:", err);
  //     res.status(500).json({
  //       success: false,
  //       message: err instanceof Error ? err.message : 'Unknown error occurred'
  //     });
  //   }
  // })


  // API to save paths
  // app.post("/api/paths", async (req, res) => {
  //   try {
  //     const { username, paths } = req.body;

  //     // Validate input
  //     if (!username || !paths || !Array.isArray(paths)) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "Username and paths are required.",
  //       });
  //     }

  //     console.log("Received username:", username, "and paths:", paths);

  //     // Call upsertUserPath to save data
  //     const result = await upsertUserPath(username, paths);

  //     if (result.success) {
  //       console.log("✅ Paths saved successfully for user:", username);
  //       res.status(201).json({
  //         success: true,
  //         message: "Paths saved successfully",
  //       });
  //     } else {
  //       console.error("❌ Failed to save paths for user:", username);
  //       res.status(500).json({
  //         success: false,
  //         message: "Failed to save paths to database",
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Error in /api/paths:", error);
  //     res.status(500).json({
  //       success: false,
  //       message: "Internal server error",
  //     });
  //   }
  // });

  // API to delete paths
  // app.delete("/api/paths", async (req, res) => {
  //   try {
  //     const { username } = req.body;
  //     if (!username) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "Username is required.",
  //       });
  //     }

  //     const path = await clearUserPath(username)
  //     if (path.success == true) {
  //       res.status(200).json({
  //         message: 'Paths deleted successfully',
  //       });
  //     } else {
  //       res.status(500).json({
  //         message: 'Path is Not Deleted Successfully'
  //       });
  //     }


  //   } catch (error) {
  //     console.error('Error deleting paths:', error);
  //     res.status(500).json({
  //       success: false,
  //       message: 'Internal server error'
  //     });
  //   }
  // });

  // // Additional API to get all paths (optional)
  // app.get("/api/paths", async (req, res) => {
  //   try {
  //     const { username } = req.body;
  //     console.log("Servser side Name   ::  ", username);

  //     const getUserPath = await getUserPathByUsername(username);

  //     res.json(
  //       getUserPath
  //     );
  //   } catch (error) {
  //     console.error('Error fetching paths:', error);
  //     res.status(500).json({
  //       success: false,
  //       path: [],
  //       message: 'Internal server error'
  //     });
  //   }
  // });
  // API to get free polygons 
  // API to get free polygons 



  // POST API to save polygons to UserPolygon table   .
  // app.post("/api/save-polygons", async (req, res) => {
  //   try {
  //     const { username, polygonName, polygons } = req.body;

  //     // Fixed variable name - changed 'polygon' to 'polygons'
  //     if (!username || !polygonName || !polygons) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "Missing required fields: username, polygonName, or polygons"
  //       });
  //     }

  //     console.log("Server side Name :: ", username);

  //     // Handle IPFS error handling
  //     const IPFS = await uploadJsonToIPFS(polygons);
  //     console.log("IPFS : ", IPFS);

  //     if (IPFS === "Error") {
  //       return res.status(500).json({
  //         success: false,
  //         message: "IPFS upload failed"
  //       });
  //     }

  //     // Convert from [{lat, lng}, ...] → [ [lng, lat], ... ]
  //     // Fixed: using 'lng' instead of 'lon'
  //     const coords = polygons.map(p => [p.lng, p.lat]);

  //     // Close polygon loop (important for Turf)
  //     if (coords.length > 0 &&
  //       (coords[0][0] !== coords[coords.length - 1][0] ||
  //         coords[0][1] !== coords[coords.length - 1][1])) {
  //       coords.push(coords[0]);
  //     }

  //     // Compute area using Turf (in square meters)
  //     const turfPolygon = polygon([coords]);
  //     const areaInSqMeters = area(turfPolygon);

  //     console.log("Polygon Area (m²):", areaInSqMeters);
  //     console.log(username, polygonName, areaInSqMeters, IPFS);

  //     // Save to database
  //     const polygonstatus = await savePolygon(username, polygonName, areaInSqMeters, IPFS);

  //     if (polygonstatus.success === true) {
  //       return res.status(200).json({
  //         success: true,
  //         message: "Polygon saved to database successfully",
  //         totalArea_m2: areaInSqMeters,
  //         IPFS: IPFS,
  //       });
  //     } else {
  //       console.error("Can't save polygon to db:", polygonstatus.error);
  //       return res.status(500).json({
  //         success: false,
  //         message: polygonstatus.message || "Failed to save polygon to database",
  //         error: polygonstatus.error
  //       });
  //     }

  //   } catch (error) {
  //     console.error("Error in /api/save-polygons:", error);
  //     return res.status(500).json({
  //       success: false,
  //       message: "Internal server error"
  //     });
  //   }
  // });





  // // minted ==true; and set transaction hash
  // app.post("/api/update-polygon-minted", async (req, res) => {
  //   const { username, nft } = req.body;
  //   console.log("API : /api/update-polygon-minted");
  //   console.log(username);
  //   console.log(nft);

  //   if (!username || !nft) {
  //     return res.status(400).json({
  //       success: false,
  //       message: "Missing required fields: username, nft, or transactionHash"
  //     });
  //   }
  //   try {
  //     console.log("Server On Updateminted polygon");

  //     const polygonstatus = await UpdateMintedPolygon(username, nft);
  //     console.log(polygonstatus);

  //     if (polygonstatus.success == true) {
  //       return res.status(200).json({
  //         success: true,
  //         message: "Polygon minted status updatedsuccessfully"
  //       });
  //     } else {
  //       return res.status(400).json({
  //         success: false,
  //         message: "Polygon is not pdatedsuccessfully"
  //       });
  //     }

  //   } catch (err) {
  //     return res.status(401).json({
  //       success: false,
  //       message: "Polygon minted status not updatedsuccessfully"
  //     });
  //   }




  // });


  // app.post("/api/get-nfts", async (req, res) => {
  //   try {
  //     const { username } = req.body;

  //     if (!username) {
  //       console.log("Username is missing or empty - returning 400");
  //       return res.status(400).json({
  //         success: false,
  //         message: 'No UserName found at API Body'
  //       });
  //     }
  //     // Get JSON From 'UserPolygon' Table - AWAIT the promise
  //     const data = await getPolygonJSON(username);

  //     if (data) {
  //       res.status(200).json({
  //         success: true,
  //         status: true,
  //         data: data
  //       });
  //     } else {
  //       res.status(404).json({
  //         success: false,
  //         status: false,
  //         message: 'No NFT data found for user'
  //       });
  //     }

  //   } catch (error) {
  //     res.status(500).json({
  //       success: false,
  //       message: 'Internal server error',
  //       error: error
  //     });
  //   }
  // });


  // get your Free NFTs
  app.post("/api/freenfts", async (req, res) => {
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


  // app.delete("/api/delete-userpath", async (req, res) => {
  //   try {
  //     const { username } = req.body;

  //     if (!username) {
  //       return res.status(200).json({
  //         mmessage: "Unable to get info from api "
  //       })
  //     }

  //     console.log("Servser side Name   ::  ", username);


  //     // const saveToDb
  //     const polygonstatus = await clearUserPath(username)
  //     if (polygonstatus.success == true) {
  //       return res.status(200).json({
  //         success: true,
  //         message: "Polygon delete from  Db successfully"
  //       });
  //     } else {

  //       return res.status(200).json({
  //         success: false
  //       });
  //     }


  //   } catch (error) {
  //     console.error('Error fetching paths:', error);
  //     res.status(500).json({
  //       success: false,
  //       message: 'Internal server error at server side api',
  //     });
  //   }
  // })




  // app.post("/api/tokeninfo", async (req: Request, res: Response) => {
  //   try {
  //     const { tokenURI, tokenId } = req.body;
  //     console.log("Received token info:", { tokenId, tokenURI });


  //     const recipient = tokenURI;
  //     // Always fetch tokenURI from contract
  //     let actualTokenURI;
  //     try {
  //       // Create server-side provider
  //       const provider = new ethers.JsonRpcProvider(process.env.VITE_PROVIDER || "https://eth-sepolia.g.alchemy.com/v2/6JXy53iLZpJ3fxoFvQNAvMJi4Y4tmC_5");
  //       actualTokenURI = await fetchTokenURI(tokenId, provider);
  //       console.log("Fetched tokenURI from contract:", actualTokenURI);


  //     } catch (contractError) {
  //       console.error("Failed to fetch tokenURI from contract:", contractError);
  //       return res.status(500).json({
  //         success: false,
  //         message: "Failed to fetch tokenURI from contract",
  //         error: contractError instanceof Error ? contractError.message : String(contractError)
  //       });
  //     }


  //     const tokeninfo = await TokenInfo(recipient, actualTokenURI, tokenId);
  //     if (tokeninfo.success == true) {
  //       return res.status(200).json({
  //         success: true,
  //         message: "TokenInfo Saved .",
  //         recipient: recipient,
  //         tokenURI: actualTokenURI,
  //         tokenId: tokenId,
  //         data: tokeninfo
  //       });
  //     } else {

  //       return res.status(500).json({
  //         success: false,
  //         message: "TokenInfo Not Saved .",
  //         recipient: recipient,
  //         tokenURI: actualTokenURI,
  //         tokenId: tokenId,
  //         data: tokeninfo
  //       });
  //     }

  //   } catch (error) {
  //     console.error("Error in /api/tokeninfo:", error);
  //     return res.status(500).json({
  //       success: false,
  //       error: error instanceof Error ? error.message : String(error),
  //     });
  //   }
  // });




  app.post("/api/get-id", async (req, res) => {
    try {
      const { tokenURI } = req.body;
      console.log("Received token info:", { tokenURI });
      const tokenID = await getTokenId(tokenURI);
      if (tokenID.success == true) {
        return res.status(200).json({
          success: true,
          message: "Token ID fetched successfully .",
          tokenID: tokenID.tokenID
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "Token ID Not fetched .",
          tokenID: tokenID.tokenID
        });
      }






    } catch (err) {
      console.log("Error is at server ", err);
      return res.status(500).json({
        success: false,
        message: "Server Error in fetching Token ID .",
      });
    }
  })



  // app.post("/api/send-msg-approval", async (req: Request, res: Response) => {
  //   try {
  //     const { owner, approved_to, tokenid } = req.body;
  //     console.log("Received token info:", { tokenid, owner, approved_to });


  //     const text = `NFT Approval Alert!\nToken ID: ${tokenid}\nOwner: ${owner}\nApproved To: ${approved_to}`;
  //     console.log(text);

  //     let telegramResult: any = null;
  //     try {
  //       telegramResult = await sendTelegramMessage(text);

  //       return res.json({
  //         success: telegramResult?.success === true,
  //         message: telegramResult?.success === true ? "Message sent to telegram." : "Message not sent to telegram.",
  //         data: telegramResult
  //       });

  //     } catch (tgErr) {
  //       console.error("Failed to send Telegram message:", tgErr);

  //       return res.status(500).json({
  //         success: false,
  //         message: "Failed to send Telegram message",
  //         error: tgErr instanceof Error ? tgErr.message : String(tgErr)
  //       });
  //     }

  //   } catch (error) {
  //     console.error("Error in /api/send-msg:", error);
  //     return res.status(500).json({
  //       success: false,
  //       error: error instanceof Error ? error.message : String(error),
  //     });
  //   }
  // });


  // app.post("/api/auto-pay", async (req: Request, res: Response) => {
  //   try {
  //     console.log("Auto-pay rewards triggered for top 3 users");

  //     // Get top 3 users from leaderboard
  //     const result = await getTop3Rewards();

  //     if (!result.success || !result.data || result.data.length === 0) {
  //       return res.status(404).json({
  //         success: false,
  //         message: "No users found in leaderboard to reward",
  //         error: result.error
  //       });
  //     }

  //     // Define reward amounts in ETH (dummy values)
  //     const rewardAmounts = [0.1, 0.05, 0.025]; // 1st, 2nd, 3rd place rewards

  //     // Simulate payment transactions
  //     const paymentResults = result.data.map((user, index) => {
  //       const rewardAmount = rewardAmounts[index] || 0.01;
  //       const dummyTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;

  //       return {
  //         rank: index + 1,
  //         username: user.UserName,
  //         address: user.Address,
  //         nftCount: user.Number_of_NFTs,
  //         rewardAmount: `${rewardAmount} ETH`,
  //         transactionHash: dummyTxHash,
  //         status: "success",
  //         timestamp: new Date().toISOString()
  //       };
  //     });

  //     // Create Telegram notification message
  //     const telegramText = `🎉 Auto-Reward Payout Complete!\n\n` +
  //       paymentResults.map(p =>
  //         `🥇 Rank ${p.rank}: ${p.username}\n` +
  //         `   💰 Reward: ${p.rewardAmount}\n` +
  //         `   🎨 NFTs: ${p.nftCount}\n` +
  //         `   📝 Address: ${p.address.substring(0, 10)}...${p.address.substring(38)}\n` +
  //         `   ✅ TX: ${p.transactionHash.substring(0, 10)}...`
  //       ).join('\n\n');

  //     // Send Telegram notification
  //     let telegramSent = false;
  //     try {
  //       const telegramResult = await sendTelegramMessage(telegramText);
  //       telegramSent = telegramResult?.success === true;
  //     } catch (tgErr) {
  //       console.error("Failed to send Telegram notification:", tgErr);
  //     }

  //     return res.status(200).json({
  //       success: true,
  //       message: `Successfully paid rewards to ${paymentResults.length} users`,
  //       data: {
  //         totalRecipients: paymentResults.length,
  //         totalRewardsETH: rewardAmounts.slice(0, paymentResults.length).reduce((a, b) => a + b, 0),
  //         payments: paymentResults,
  //         telegramNotification: telegramSent ? "sent" : "failed"
  //       }
  //     });

  //   } catch (err) {
  //     console.error("Error in /api/auto-pay:", err);
  //     return res.status(500).json({
  //       success: false,
  //       message: err instanceof Error ? err.message : "Unknown error in auto-pay",
  //       error: err instanceof Error ? err.message : String(err)
  //     });
  //   }
  // });




  // app.post("/api/send-msg", async (req: Request, res: Response) => {
  //   try {
  //     const { tokenURI, tokenId } = req.body;
  //     console.log("Received token info:", { tokenId, tokenURI });

  //     // Always fetch tokenURI from contract
  //     let actualTokenURI;
  //     try {
  //       // Create server-side provider
  //       const provider = new ethers.JsonRpcProvider(process.env.VITE_PROVIDER || "https://eth-sepolia.g.alchemy.com/v2/6JXy53iLZpJ3fxoFvQNAvMJi4Y4tmC_5");
  //       actualTokenURI = await fetchTokenURI(tokenId, provider);
  //       console.log("Fetched tokenURI from contract:", actualTokenURI);

  //     } catch (contractError) {
  //       console.error("Failed to fetch tokenURI from contract:", contractError);
  //       return res.status(500).json({
  //         success: false,
  //         message: "Failed to fetch tokenURI from contract",
  //         error: contractError instanceof Error ? contractError.message : String(contractError)
  //       });
  //     }

  //     const text = `A new NFT has been minted!\nToken ID: ${tokenId}\nRecipient: ${tokenURI}\nToken URI: ${actualTokenURI}`;
  //     console.log(text);

  //     let telegramResult: any = null;
  //     try {
  //       telegramResult = await sendTelegramMessage(text);

  //       return res.json({
  //         success: telegramResult?.success === true,
  //         message: telegramResult?.success === true ? "Message sent to telegram." : "Message not sent to telegram.",
  //         recipient: tokenURI,
  //         tokenURI: actualTokenURI,
  //         tokenId: tokenId,
  //         data: telegramResult
  //       });

  //     } catch (tgErr) {
  //       console.error("Failed to send Telegram message:", tgErr);

  //       return res.status(500).json({
  //         success: false,
  //         message: "Failed to send Telegram message",
  //         recipient: tokenURI,
  //         tokenURI: actualTokenURI,
  //         tokenId: tokenId,
  //         error: tgErr instanceof Error ? tgErr.message : String(tgErr)
  //       });
  //     }

  //   } catch (error) {
  //     console.error("Error in /api/send-msg:", error);
  //     return res.status(500).json({
  //       success: false,
  //       error: error instanceof Error ? error.message : String(error),
  //     });
  //   }
  // });



  // Create a Marketplace item notification
  // Expects: { itemId, nft, tokenId, price, seller }
  // app.post("/api/marketplace/newitem", async (req: Request, res: Response) => {
  //   try {
  //     const { itemId, nft, tokenId, price, seller } = req.body || {};

  //     const text = `New Marketplace Listing\n` +
  //       `Item ID: ${itemId ?? "N/A"}\n` +
  //       `NFT: ${nft ?? "N/A"}\n` +
  //       `Token ID: ${tokenId ?? "N/A"}\n` +
  //       `Price: ${price ?? "N/A"}\n` +
  //       `Seller: ${seller ?? "N/A"}`;

  //     try {
  //       const result = await sendTelegramMessage(text);
  //       return res.status(200).json({
  //         success: result?.success === true,
  //         message: result?.success === true ? "Message sent to telegram." : "Message not sent to telegram.",
  //         data: {
  //           itemId, nft, tokenId, price, seller,
  //           telegram: result
  //         }
  //       });
  //     } catch (tgErr) {
  //       console.error("Failed to send Telegram message:", tgErr);
  //       return res.status(500).json({
  //         success: false,
  //         message: "Failed to send Telegram message",
  //         error: tgErr instanceof Error ? tgErr.message : String(tgErr)
  //       });
  //     }
  //   } catch (err) {
  //     console.error("Error in /api/marketplace/newitem:", err);
  //     return res.status(500).json({
  //       success: false,
  //       message: err instanceof Error ? err.message : "Unknown server error"
  //     });
  //   }
  // });



  // app.post('/api/detect-loops', async (req, res) => {
  //   // Let detectClosedLoopsHandler handle sending the response
  //   try {


  //     const detect = detectClosedLoopsHandler(req, res);
  //     console.log(detect);

  //   } catch (err) {
  //     console.log('Error in detection python file ', err);

  //   }
  // });

  // app.post('/api/save-address', async (req, res) => {
  //   const { Address, username } = req.body;
  //   if (!Address || !username) {
  //     console.log("Not reviced Address & UserName");
  //     return res.json({
  //       status: false,
  //       message: "No Address / UserName found "
  //     });
  //   } else {

  //   }
  // })


  // app.post('/api/approve', async (req, res) => {


  //   let telegramResult: any = null;
  //   try {
  //     const { tokenId, receipient } = req.body;
  //     const text = " Testing ";
  //     telegramResult = await sendTelegramMessage(text);

  //     return res.json({
  //       success: telegramResult?.success === true,
  //       message: telegramResult?.success === true ? "Message sent to telegram." : "Message not sent to telegram.",
  //       data: telegramResult
  //     });

  //   } catch (tgErr) {
  //     console.error("Failed to send Telegram message:", tgErr);

  //     return res.status(500).json({
  //       success: false,
  //       message: "Failed to send Telegram message",
  //       error: tgErr instanceof Error ? tgErr.message : String(tgErr)
  //     });
  //   }
  // });

  // API to get top 3 users for rewards from Leaderboard
  // app.post("/api/rewards/top3", async (req: Request, res: Response) => {
  //   try {
  //     const result = await getTop3Rewards();









  //     if (!result.success) {
  //       return res.status(result.data && result.data.length === 0 ? 404 : 500).json({
  //         success: false,
  //         message: result.message,
  //         error: result.error,
  //       });
  //     }

  //     return res.status(200).json({
  //       success: true,
  //       message: result.message,
  //       data: {
  //         top3Users: result.data,
  //         usernames: result.data?.map((user) => user.UserName) || [],
  //       },
  //     });
  //   } catch (err) {
  //     console.error("Error in /api/rewards/top3:", err);
  //     return res.status(500).json({
  //       success: false,
  //       message: err instanceof Error ? err.message : "Unknown server error",
  //     });
  //   }
  // });

  // app.post("/api/MintedToken_EventListner", async (req, res) => {
  //   try {
  //     const { recipient, tokenURI, tokenId } = req.body;
  //     // const result = await EventListner_MintedToken_Save(recipient, tokenURI, tokenId);
  //     try {
  //      console.log("Testing Supabase Connection...");
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('users').select('*').limit(1);
  //         .from('MintedToken')
  //         .insert([
  //           { recipient: recipient, tokenURI: tokenURI, tokenId: tokenId },
  //         ])
  //         .select()


  //       if (error) {
  //         return res.status(404).json({
  //           success: false,
  //           error: error,
  //         });
  //       }
  //       return res.status(200).json({
  //         success: true,
  //         data: data,
  //       });
  //     } catch (error) {
  //       console.error('Error getting user path:', error);
  //       return res.status(500).json({
  //         success: false,
  //         error: error
  //       });
  //     }

  //   } catch (err) {
  //     console.error("Error in /api/MintedToken_EventListner:", err);
  //     return res.status(500).json({
  //       success: false,
  //       error: err instanceof Error ? err.message : "Unknown server error",
  //     });
  //   }
  // });

  const httpServer = createServer(app);
  return httpServer;
}

