import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const MeteorShower = () => {
    const [meteors, setMeteors] = useState<number[]>([]);

    useEffect(() => {
        // initialize some meteors
        const newMeteors = new Array(15).fill(0).map((_, i) => i);
        setMeteors(newMeteors);
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            {meteors.map((el, idx) => (
                <span
                    key={idx}
                    className="absolute top-0 left-1/2 w-0.5 h-0.5 bg-slate-100 shadow-[0_0_0_1px_#ffffff10] rotate-[215deg] animate-meteor"
                    style={{
                        top: 0,
                        left: Math.floor(Math.random() * (window.innerWidth)) + 'px',
                        animationDelay: Math.random() * (0.8 - 0.2) + 0.2 + 's',
                        animationDuration: Math.floor(Math.random() * (10 - 2) + 2) + 's',
                        // Push more to the sides as requested
                        marginLeft: idx % 2 === 0 ? `-${Math.floor(Math.random() * 600 + 400)}px` : `${Math.floor(Math.random() * 600 + 400)}px`,
                    }}
                >
                    {/* Meteor Tail */}
                    <div className="pointer-events-none absolute top-1/2 -z-10 h-[1px] w-[50px] -translate-y-1/2 bg-gradient-to-r from-blue-500 to-transparent" />
                </span>
            ))}
            <style>{`
        @keyframes meteor {
          0% {
            transform: rotate(215deg) translateX(0);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: rotate(215deg) translateX(-800px);
            opacity: 0;
          }
        }
        .animate-meteor {
          animation: meteor 5s linear infinite;
        }
      `}</style>
        </div>
    );
};

export default MeteorShower;
