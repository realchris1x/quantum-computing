import React from 'react';
import { motion } from 'framer-motion';

interface Step {
  label: string;
  icon: string;
  done: boolean;
  active: boolean;
}

interface Props { steps: Step[]; }

export const ConversionPipeline: React.FC<Props> = ({ steps }) => {
  return (
    <div className="flex flex-col gap-1">
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`pipeline-step ${step.active ? 'active' : ''} ${step.done ? 'done' : ''}`}
          >
            <span className="text-base">{step.icon}</span>
            <span className={`text-sm font-medium ${step.active ? 'text-primary font-semibold' : step.done ? 'text-success' : 'text-muted'}`}>
              {step.label}
            </span>
            {step.done && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-auto text-success text-sm"
              >✓</motion.span>
            )}
            {step.active && (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="ml-auto text-primary text-sm"
              >⟳</motion.span>
            )}
          </motion.div>
          {i < steps.length - 1 && (
            <div className="flex justify-center">
              <div className={`w-px h-3 ${step.done ? 'bg-success/40' : 'bg-surface-200'}`} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ConversionPipeline;
