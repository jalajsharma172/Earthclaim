import { Request, Response } from "express";
import { spawn } from "child_process";

export const detectClosedLoopsHandler = (req: Request, res: Response) => {
  const userpath = req.body.userpath;
  console.log("Servers side at loopdetection.ts ",userpath);
  
  if (!Array.isArray(userpath) || userpath.length < 2) {
    return res.status(400).json({ error: "Invalid userpath" });
  }

  // Spawn the Python subprocess
  const pythonProcess = spawn("python", ["./server/loop_detection.py"]);

  // Send userpath to the Python script via stdin
  //That tolerance : 50.0 means if the start and end points are within 50 meters,
  pythonProcess.stdin.write(JSON.stringify({ userpath , tolerance: 10000.0  }));
  pythonProcess.stdin.end();

  let result = "";

  // Collect data from the Python script
  pythonProcess.stdout.on("data", (data) => {
    result += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`Python error: ${data}`);
  });

  pythonProcess.on("close", (code) => {
    if (code === 0) {
      try {
        const detectionResult = JSON.parse(result);
        console.log(detectionResult);
        
        res.json(detectionResult);
      } catch (error) {
        res.status(500).json({ error: "Failed to parse Python script output" });
      }
    } else {
      res.status(500).json({ error: "Python script failed" });
    }
  });
};