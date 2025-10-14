import { supabase } from "@shared/supabaseClient";

export async function upsertUserPath(username: string, path: any[]) {
  try {
    console.log("Upserting username:", username, "with path:", path);

    const { data, error } = await supabase
      .from("UserPath")
      .upsert(
        {
          UserName: username,
          Path: path,
        },
        {
          onConflict: "UserName", // This handles both insert and update
        }
      )
      .select();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    console.log("✅ Data upserted successfully. Username:", username, "Path points:", path.length);

    return { success: true, data };
  } catch (error) {
    console.error("Error upserting user path:", error);
    return { success: false };
  }
}

