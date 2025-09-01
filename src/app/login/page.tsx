"use client";

import { createClient } from "../../../lib/supabase-browser";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleGitHubLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          // redirectTo: `${window.location.origin}/auth/v1/callback`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error logging in:", error);
      alert("Error logging in!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-zinc-900">CodeCrate</h2>
          <p className="mt-2 text-zinc-600">
            Save and organize your code snippets
          </p>
        </div>

        <button
          onClick={handleGitHubLogin}
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in with GitHub"}
        </button>
      </div>
    </div>
  );
}
