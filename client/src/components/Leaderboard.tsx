import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Use your actual Supabase credentials from .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY ;

const supabase = createClient(supabaseUrl, supabaseKey);

interface LeaderboardRow {
  id: number;
  UserName: string;
  Number_of_NFTs: number;
  Address: string;
}

export default function Leaderboard() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>("");

  // Calculate next payout time (every 6 hours)
  const getNextPayoutTime = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const nextPayoutHour = Math.ceil(currentHour / 6) * 6;
    const nextPayout = new Date(now);
    nextPayout.setHours(nextPayoutHour, 0, 0, 0);
    
    // If nextPayoutHour is 24 or more, move to next day
    if (nextPayoutHour >= 24) {
      nextPayout.setDate(nextPayout.getDate() + 1);
      nextPayout.setHours(0, 0, 0, 0);
    }
    
    return nextPayout;
  };

  // Update countdown timer every second
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextPayout = getNextPayoutTime();
      const diff = nextPayout.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Processing rewards...");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
    const { data, error } = await supabase
      .from("LeaderBoard")
      .select("*"); // Select all columns

      console.log(data);
      if (error) {
        console.error("Error fetching leaderboard:", error.message);
        // setRows([]);
      } else if (data) {
        // Sort by Number_of_NFTs in descending order (highest first)
        const sortedData = [...data].sort((a, b) => b.Number_of_NFTs - a.Number_of_NFTs);
        setRows(sortedData);
         console.log("Got Data from Supabase:", sortedData);
      } else {
        // setRows([]);
        console.log("No data returned from Supabase");
      }
      setLoading(false);
    }
    fetchLeaderboard();
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-12 p-8 bg-white rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold text-blue-800 mb-6">Leaderboard</h1>
      

      
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-blue-100">
            <th className="py-2 px-4 border">Serial Number</th>
            <th className="py-2 px-4 border">User Name</th>
            <th className="py-2 px-4 border">Number of NFTs</th>
            <th className="py-2 px-4 border">Address</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={3} className="text-center py-6">Loading...</td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="text-center py-6">No data found.</td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={row.id} className="hover:bg-blue-50">
                <td className="py-2 px-4 border">{idx + 1}</td>
                <td className="py-2 px-4 border">{row.UserName}</td>
                <td className="py-2 px-4 border">{row.Number_of_NFTs}</td>
                <td className="py-2 px-4 border">{row.Address.slice(0, 6)}...{row.Address.slice(-4) }</td>
              </tr>
            ))
          )}
        </tbody>
      </table>


            {/* Countdown Timer */}
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-md">
        <div className="text-center text-white">
          <p className="text-lg font-semibold mb-1">⏰ Next Auto-Reward Payout for Top 3</p>
          <p className="text-3xl font-bold">{timeLeft}</p>
        </div>
      </div>


      
    </div>
  );
}