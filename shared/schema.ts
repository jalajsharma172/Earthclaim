 
import { pgTable, text, varchar, real, timestamp, integer } from "drizzle-orm/pg-core";
 import { z } from "zod"; 


 
// Zod Schemas
export const loginSchema = z.object({
  useremail: z.string().email("Invalid email format"),
  username: z.string().min(1, "Username is required"), 
});

export const userpathSchema = z.object({
  username: z.string().min(1, "Username is required"),
  path: z.array(z.object({
    lat: z.number(),
    lon: z.number()
  })).default([]),  
});

export const UserPolygon =   z.array(z.object({
    UserName : z.string(),
    IPFS: z.string(),
    Area: z.string()
  })).default([]);  

 

 
 

 

 
 
 



 