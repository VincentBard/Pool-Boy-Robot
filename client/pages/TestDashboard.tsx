import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import TestCard from "../test/TestCard";

export default function TestDashboard() {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();

  if (!isAuthenticated) return <div>Please log in to run tests.</div>;

  const API_BASE = "https://pbrobot.onrender.com/api";

  const getToken = async () => await getAccessTokenSilently();

  const testDB = async () => {
    try {
      const token = await getToken();
      const deviceId = "68cc90c7ef0763dddf1a5e9d";
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_BASE}/readings/device/${deviceId}`, {
        headers,
      });
      return res.status === 200 && Array.isArray(res.data);
    } catch {
      return false;
    }
  };

  const testAuth = async () => {
    try {
      const res = await axios.get(`${API_BASE}/readings`);
      return res.status === 401 || res.status === 403;
    } catch (e) {
      return true; // unauthorized as expected
    }
  };

  const testLatency = async () => {
    const start = performance.now();
    const token = await getToken();
    const headers = { Authorization: `Bearer ${token}` };
    await axios.get(`${API_BASE}/devices`, { headers });
    const end = performance.now();
    const ms = end - start;
    console.log("Load time:", ms.toFixed(2), "ms");
    return ms < 2000;
  };

  const testVideoConnection = async () => {
    // For now, just ping LiveKit backend token endpoint
    try {
      const res = await axios.get(
        "https://pbrobot.onrender.com/getToken?identity=tester&roomName=pool"
      );
      return res.status === 200 && res.data.token;
    } catch {
      return false;
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">🧪 System Test Dashboard</h1>
      <p className="text-gray-600 mb-4">
        Logged in as: <b>{user?.email}</b>
      </p>

      <TestCard title="Verify DB Read Access" testFn={testDB} />
      <TestCard title="Confirm Auth0 Blocks Unauthorized Access" testFn={testAuth} />
      <TestCard title="Website/API Latency Under 2s" testFn={testLatency} />
      <TestCard title="Check LiveKit Token Endpoint" testFn={testVideoConnection} />
    </div>
  );
}