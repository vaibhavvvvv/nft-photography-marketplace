interface ProgressLoaderProps {
  steps: Array<{
    label: string;
    status: 'pending' | 'current' | 'completed';
  }>;
}

export default function ProgressLoader({ steps }: ProgressLoaderProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative">
        {/* Progress bar */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-emerald-200/20">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{
              width: `${(steps.filter(step => step.status === 'completed').length / (steps.length - 1)) * 100}%`
            }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => (
            <div key={step.label} className="flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  step.status === 'completed' ? 'bg-emerald-500' :
                  step.status === 'current' ? 'bg-emerald-500/50' :
                  'bg-emerald-200/20'
                }`}
              >
                {step.status === 'completed' ? (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : step.status === 'current' ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-white">{index + 1}</span>
                )}
              </div>
              <span className="mt-2 text-xs text-emerald-200">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Spinner */}
      {steps.some(step => step.status === 'current') && (
        <div className="mt-8 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-emerald-200 text-sm">
            {steps.find(step => step.status === 'current')?.label}...
          </p>
        </div>
      )}
    </div>
  );
} 