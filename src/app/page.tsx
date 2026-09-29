import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/db/prisma";
import WorkspaceClient from "./_components/WorkspaceClient";
import LoginModal from "./_components/LoginModal";

export default async function HomePage() {
  const session = await verifySession();
  
  let user = null;
  if (session) {
    user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        notes: true,
        tasks: {
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
          orderBy: { date: "asc" }
        }
      }
    });
  }

  return (
    <main className="h-screen w-screen fixed inset-0 text-white overflow-hidden font-sans bg-transparent">
      {!user && <LoginModal />}
      
      <div className={`relative z-10 w-full h-screen flex flex-col p-6 transition-all duration-500 ${!user ? 'blur-md pointer-events-none' : 'pointer-events-none'}`}>
        <header className="flex justify-between items-center mb-6 pointer-events-auto">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-cyan-500/20">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Hello, {user.name}</h1>
                <p className="text-sm text-cyan-400 font-medium">🔥 {user.currentStreak} day streak</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 opacity-50">
              <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center font-bold text-lg">?</div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-300">Welcome Guest</h1>
                <p className="text-sm text-slate-500 font-medium">Login to save your streak</p>
              </div>
            </div>
          )}
          <div className="flex gap-4">
            <a href="/decks" className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md rounded-lg font-medium text-sm transition-colors border border-slate-700 pointer-events-auto">
              Flashcards
            </a>
            <a href="/interview" className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md rounded-lg font-medium text-sm transition-colors border border-slate-700 pointer-events-auto">
              AI Interview
            </a>
          </div>
        </header>

        <div className="pointer-events-auto w-full flex-1 relative">
          <WorkspaceClient initialNotes={user?.notes} initialTasks={user?.tasks} userId={user?.id} />
        </div>
      </div>
    </main>
  );
}