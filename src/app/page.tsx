import { Wizard } from "~/components/Wizard";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  return (
    <HydrateClient>
      <main className="min-h-screen bg-gray-50">
        <header className="bg-white py-6 shadow-sm">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold text-blue-600">SecretAir</h1>
            <p className="text-gray-600">Send physical letters without a printer</p>
          </div>
        </header>
        
        <div className="container mx-auto py-8">
          <Wizard />
        </div>
        
        <footer className="bg-white py-6 shadow-inner">
          <div className="container mx-auto px-4 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} SecretAir - MVP Version</p>
          </div>
        </footer>
      </main>
    </HydrateClient>
  );
}
