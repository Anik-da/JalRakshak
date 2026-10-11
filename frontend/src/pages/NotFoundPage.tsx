import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-surface-muted border border-carto-border flex items-center justify-center mx-auto text-forest shadow-carto-sm">
        <Compass className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-mono uppercase text-carto-muted">Error 404</span>
        <h1 className="text-3xl font-display font-bold text-carto-text">
          Unmapped Sector Coordinate
        </h1>
        <p className="text-xs text-carto-muted leading-relaxed">
          The requested hazard route or operational view does not exist on our cartographic grid.
        </p>
      </div>

      <div className="pt-2">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 bg-forest hover:bg-forest-deep text-white px-5 py-2.5 rounded-lg text-xs font-mono transition shadow-carto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Exploration</span>
        </Link>
      </div>
    </div>
  );
};
