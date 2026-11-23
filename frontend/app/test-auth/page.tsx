
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TestAuthPage() {
  const [result, setResult] = useState("Testing chair permissions...");

  useEffect(() => {
    async function testAuthentication() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        const token = data.session?.access_token;

        if (!token) {
          setResult("No active session. Please log in first.");
          return;
        }

        // TEST 1: Chair should be allowed to view groups
        const getResponse = await fetch(
          "http://127.0.0.1:8000/api/groups/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!getResponse.ok) {
          setResult(`GET test failed: HTTP ${getResponse.status}`);
          return;
        }

        // TEST 2: Chair should be allowed to create a group
        const postResponse = await fetch(
          "http://127.0.0.1:8000/api/groups/",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: "Temporary Chair Permission Test",
            }),
          }
        );

        if (postResponse.status === 201) {
          setResult(
            "SUCCESS! Chair can view groups (GET) and create groups (POST)."
          );
        } else {
          const body = await postResponse.json();
          setResult(
            `Chair permission test failed: HTTP ${postResponse.status}. ${JSON.stringify(body)}`
          );
        }
      } catch (error) {
        setResult(
          error instanceof Error ? error.message : "Unknown error occurred."
        );
      }
    }

    testAuthentication();
  }, []);

  return (
    <main style={{ padding: "30px" }}>
      <h1>Supabase Authentication Test</h1>
      <p>{result}</p>
    </main>
  );
}
