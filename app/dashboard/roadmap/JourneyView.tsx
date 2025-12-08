import React from 'react';

// Re-using types from page.tsx (or ideally these should be in a shared types file)
type Roadmap = {
  id: number;
  title: string;
  desc: string;
  divisionId: number;
  Division: {
    id: number;
    name: string;
  };
};

interface JourneyViewProps {
  roadmaps: Roadmap[];
}

const JourneyView: React.FC<JourneyViewProps> = ({ roadmaps }) => {
  if (!roadmaps || roadmaps.length === 0) {
    return (
      <div className="p-8 text-center text-neutral-600">
        No roadmap items found for your journey.
      </div>
    );
  }

  return (
    <div className="relative container mx-auto px-4 py-8">
      {/* Vertical Line */}
      <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-primary-200 -translate-x-1/2 hidden md:block"></div>

      <div className="space-y-8">
        {roadmaps.map((item, index) => (
          <div key={item.id} className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} flex-col`}>

            {/* Timeline Dot (Desktop) */}
            <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary-500 border-4 border-white shadow-sm hidden md:block z-10"></div>

            {/* Content Card */}
            <div className="w-full md:w-1/2 px-4">
              <div className={`
                bg-white p-6 rounded-xl shadow-md border border-neutral-200 hover:shadow-lg transition-shadow
                relative
                ${index % 2 === 0 ? 'md:mr-8' : 'md:ml-8'}
              `}>
                {/* Mobile Timeline Dot */}
                <div className="absolute left-[-25px] top-6 w-4 h-4 rounded-full bg-primary-500 border-4 border-white shadow-sm md:hidden"></div>
                {/* Mobile Vertical Line Segment */}
                <div className="absolute left-[-18px] top-10 bottom-[-40px] w-0.5 bg-primary-200 md:hidden last:hidden"></div>


                <div className="flex items-center justify-between mb-2">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
                    {item.Division.name}
                  </span>
                  <span className="text-xs text-neutral-400">Step {index + 1}</span>
                </div>

                <h3 className="text-xl font-bold text-neutral-900 mb-2">{item.title}</h3>
                <p className="text-neutral-600 text-body-md leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>

            {/* Spacer for the other side */}
            <div className="w-full md:w-1/2"></div>
          </div>
        ))}

        {/* --- Inspiring Card (Always at the end) --- */}
        {(() => {
          const index = roadmaps.length;
          return (
            <div className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} flex-col`}>

              {/* Timeline Dot (Desktop) - Star Icon for distinction */}
              <div className="absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-yellow-400 border-4 border-white shadow-sm hidden md:flex items-center justify-center z-10">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>

              {/* Content Card */}
              <div className="w-full md:w-1/2 px-4">
                <div className={`
                                    bg-gradient-to-br from-primary-500 to-primary-700 p-8 rounded-xl shadow-lg border-none
                                    relative text-white transform hover:scale-105 transition-transform duration-300
                                    ${index % 2 === 0 ? 'md:mr-8' : 'md:ml-8'}
                                `}>
                  {/* Mobile Timeline Dot */}
                  <div className="absolute left-[-25px] top-6 w-4 h-4 rounded-full bg-yellow-400 border-4 border-white shadow-sm md:hidden"></div>

                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">🚀</span>
                    <h3 className="text-2xl font-bold">The Journey Continues...</h3>
                  </div>
                  <p className="text-primary-50 text-lg leading-relaxed font-medium">
                    "Every step you take brings you closer to your goals. Keep learning, keep growing, and never stop believing in yourself. The future is yours to create!"
                  </p>
                </div>
              </div>

              {/* Spacer for the other side */}
              <div className="w-full md:w-1/2"></div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default JourneyView;
