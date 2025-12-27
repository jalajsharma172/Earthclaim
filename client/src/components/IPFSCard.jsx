import { motion } from "framer-motion";
const IPFSCard = () => {
    return (<motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 }} className="pointer-events-auto mt-6">
            <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-[#0f0f13] p-1 shadow-2xl transition-transform hover:scale-[1.02]">
                {/* Background Stars Effect */}
                <div className="absolute inset-0 z-0 opacity-80">
                    <div className="h-full w-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-[#0f0f13] to-black"></div>
                    {/* Stars */}
                    {Array.from({ length: 50 }).map((_, i) => (<div key={i} className="absolute rounded-full bg-white" style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                opacity: Math.random() * 0.7 + 0.3,
            }}></div>))}
                </div>

                {/* Content */}
                <div className="relative z-10 flex h-64 flex-col justify-between p-8">
                    {/* Top Logo Area */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-white">
                            {/* Cloud Icon */}
                            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                                <path d="M4.5 9.5a4.5 4.5 0 014.28-3.09 5.5 5.5 0 0110.44 2.5 3 3 0 012.78 2.59A3 3 0 0119 17H6a4 4 0 01-1.5-7.5z"/>
                                <path d="M12 13l-3 3h2v3h2v-3h2l-3-3z" className="text-[#3448c5]"/>
                            </svg>
                            <span className="font-sans text-xl font-bold tracking-tight">Cloudinary</span>
                        </div>
                        <span className="font-light tracking-widest text-gray-400">LABS</span>
                    </div>

                    {/* Main Text */}
                    <div className="flex justify-center">
                        <h1 className="bg-gradient-to-b from-white to-gray-500 bg-clip-text font-sans text-8xl font-thin tracking-wider text-transparent drop-shadow-lg">
                            IPFS
                        </h1>
                    </div>

                    {/* Bottom Decorative Element */}
                    <div className="flex justify-between items-end">
                        <div className="h-1 w-12 rounded-full bg-blue-500/50"></div>
                        <div className="text-[10px] text-gray-500 font-mono">DECENTRALIZED STORAGE</div>
                    </div>
                </div>
            </div>
        </motion.div>);
};
export default IPFSCard;
