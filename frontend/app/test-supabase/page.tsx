"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function TestSupabasePage() {
  const [message, setMessage] = useState("Testing Supabase connection...");

  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setMessage("Connection error: " + error.message);
        return;
      }

      setMessage(
        data.session
          ? "Connected! A user session exists."
          : "Connected successfully! No user is logged in yet."
      );
    }

    testConnection();
  }, []);

  return (
    <main style={{ padding: "40px" }}>
      <h1>Supabase Connection Test</h1>
      <p>{message}</p>
    </main>
  );
}
