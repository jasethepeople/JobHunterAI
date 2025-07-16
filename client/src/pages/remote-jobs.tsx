import Sidebar from "@/components/Sidebar";
import RemoteJobSearch from "@/components/RemoteJobSearch";

export default function RemoteJobs() {
  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Remote Job Search</h2>
              <p className="text-slate-600">AI-powered remote job discovery and matching</p>
            </div>
          </div>
        </header>

        <RemoteJobSearch userId={1} />
      </main>
    </div>
  );
}