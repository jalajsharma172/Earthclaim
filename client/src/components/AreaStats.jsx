import { useQuery } from "@tanstack/react-query";
import { MapPin, Clock, Trophy, Target } from "lucide-react";
import { useEffect } from "react";
export default function AreaStats({ user, onClose }) {
    const { data: completedCirclesData } = useQuery({
        queryKey: ['/api/completed-circles/user', user.id],
    });
    // Handle escape key to close modal
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);
    const completedCircles = completedCirclesData?.completedCircles || [];
    const totalCompletedCircles = completedCircles.length;
    const totalAreaClaimed = completedCircles.reduce((sum, circle) => sum + (circle.area || 0), 0);
    const averageCompletionTime = completedCircles.length > 0
        ? completedCircles.reduce((sum, circle) => sum + (circle.completionTime || 0), 0) / completedCircles.length
        : 0;
    return (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Statistics</h2>
            <div className="flex items-center space-x-2">
              <button onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Close button clicked');
            onClose();
        }} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 cursor-pointer z-10 relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
              <button onClick={onClose} className="text-sm text-blue-600 hover:text-blue-800 underline">
                Close
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Total Area */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white">
              <div className="flex items-center space-x-3">
                <MapPin className="w-8 h-8"/>
                <div>
                  <p className="text-sm opacity-90">Total Area Claimed</p>
                  <p className="text-2xl font-bold">{Math.round(totalAreaClaimed).toLocaleString()} m²</p>
                </div>
              </div>
            </div>

            {/* Claims */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Trophy className="w-6 h-6 text-yellow-600"/>
                <div>
                  <p className="text-sm text-gray-600">Total Claims</p>
                  <p className="text-xl font-bold text-gray-900">{user.totalClaims || 0}</p>
                </div>
              </div>
            </div>

            {/* Completed Circles */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Target className="w-6 h-6 text-green-600"/>
                <div>
                  <p className="text-sm text-gray-600">Completed Circles</p>
                  <p className="text-xl font-bold text-gray-900">{totalCompletedCircles}</p>
                </div>
              </div>
            </div>

            {/* Average Completion Time */}
            {averageCompletionTime > 0 && (<div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <Clock className="w-6 h-6 text-blue-600"/>
                  <div>
                    <p className="text-sm text-gray-600">Avg. Completion Time</p>
                    <p className="text-xl font-bold text-gray-900">{Math.round(averageCompletionTime)}s</p>
                  </div>
                </div>
              </div>)}

            {/* Recent Completed Circles */}
            {completedCircles.length > 0 && (<div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Circles</h3>
                <div className="space-y-2">
                  {completedCircles.slice(0, 3).map((circle) => (<div key={circle.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {new Date(circle.createdAt).toLocaleDateString()}
                      </span>
                      <span className="font-medium text-gray-900">
                        {Math.round(circle.area)} m²
                      </span>
                      {circle.completionTime && (<span className="text-blue-600">
                          {Math.round(circle.completionTime)}s
                        </span>)}
                    </div>))}
                </div>
              </div>)}
          </div>
        </div>
      </div>
    </div>);
}
