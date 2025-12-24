import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-900 relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <Card className="w-full max-w-md mx-4 relative z-10 bg-gray-800/80 backdrop-blur-md border-cyan-400/50 border-2 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
        {/* Corner Decorations */}
        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-cyan-400"></div>
        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-cyan-400"></div>
        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-cyan-400"></div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-cyan-400"></div>

        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <AlertCircle className="h-20 w-20 text-red-500 animate-pulse" />
              <div className="absolute inset-0 h-20 w-20 text-red-500 blur-xl opacity-50"></div>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-red-500 font-mono tracking-wider mb-2">
            404 ERROR
          </h1>

          <p className="text-cyan-300 font-mono text-lg mb-6">
            &gt; PAGE NOT FOUND
          </p>

          <p className="mt-4 text-sm text-gray-400 font-mono mb-8 max-w-sm mx-auto">
            The requested resource does not exist in the system database. Please verify the URL and try again.
          </p>

          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold font-mono py-3 px-8 rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] border border-cyan-400/50"
          >
            🏠 RETURN TO BASE
          </button>

          {/* HUD-style footer */}
          <div className="mt-8 pt-4 border-t border-gray-700">
            <div className="flex justify-between text-xs text-cyan-400/60 font-mono">
              <span>ERROR CODE: 404</span>
              <span>SYSTEM ONLINE</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
