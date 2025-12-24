import { useEffect, useRef } from 'react';

const StarField = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let stars: { x: number; y: number; size: number; speed: number; brightness: number }[] = [];

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initStars();
        };

        const initStars = () => {
            const starCount = Math.floor((canvas.width * canvas.height) / 2500); // Density
            stars = [];
            for (let i = 0; i < starCount; i++) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 1.5 + 0.5, // Tiny stars
                    speed: Math.random() * 0.2 + 0.05, // Very slow speed
                    brightness: Math.random(),
                });
            }
        };

        const animate = () => {
            if (!ctx || !canvas) return;

            ctx.fillStyle = '#050b14'; // Dark deep space background
            ctx.fillRect(0, 0, canvas.width, canvas.height); // Clear with bg color

            stars.forEach((star) => {
                // Update position
                star.y += star.speed;

                // Reset if off screen
                if (star.y > canvas.height) {
                    star.y = 0;
                    star.x = Math.random() * canvas.width;
                }

                // Draw star
                const opacity = 0.5 + Math.abs(Math.sin(Date.now() * 0.001 + star.x)) * 0.5; // Twinkle
                ctx.fillStyle = `rgba(255, 255, 255, ${opacity * star.brightness})`;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10"
            style={{ background: '#050b14' }}
        />
    );
};

export default StarField;
