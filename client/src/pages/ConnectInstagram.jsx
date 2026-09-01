import React, { useState } from "react";
import api from "../lib/api";
import { Button } from "../components/ui/button";

export default function ConnectInstagram() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);
      // Calls our backend to generate the OAuth URL
      const response = await api.get("/instagram/auth");
      
      if (response.data && response.data.url) {
        // Redirect the user to Facebook / Meta for authentication
        window.location.href = response.data.url;
      }
    } catch (err) {
      console.error(err);
      setError("Failed to initiate connection to Instagram.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 mt-10 bg-white rounded-xl shadow border border-gray-200 text-center">
      <h2 className="text-3xl font-bold mb-4 text-gray-900">Connect Your Instagram</h2>
      <p className="text-gray-600 mb-8">
        Link your professional Instagram account to provide verified performance metrics to brands.
        This helps you secure more campaigns and long-term contracts.
      </p>

      {error && <div className="mb-4 text-red-600 font-semibold">{error}</div>}

      <Button onClick={handleConnect} disabled={loading} className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:scale-105">
        {loading ? "Connecting..." : "Connect Instagram"}
      </Button>

      <div className="mt-8 text-sm text-gray-500 text-left">
        <h4 className="font-semibold text-gray-700 mb-2">Requirements:</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>You must have an Instagram Professional (Creator or Business) Account.</li>
          <li>Your Instagram account must be connected to a Facebook Page.</li>
        </ul>
      </div>
    </div>
  );
}
