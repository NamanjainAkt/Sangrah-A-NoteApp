import React from 'react';
import { Link } from 'react-router-dom';

/**
 * FeatureDisabled Component
 * Displays a message when a feature is not enabled in Settings
 * Provides a direct link to enable the feature
 */
const FeatureDisabled = ({ featureName, icon, description }) => {
  return (
    <div className="w-full max-w-lg mx-auto px-4 py-12">
      <div className="bg-[#171717] rounded-2xl p-8 text-center border border-gray-800">
        {/* Icon */}
        <div className="mb-6">
          <span className="material-symbols-outlined text-6xl text-gray-600">
            {icon || 'lock'}
          </span>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-white mb-2">
          {featureName} is disabled
        </h2>
        <p className="text-gray-400 mb-6">
          {description || `Enable the ${featureName} feature in Settings to use this feature.`}
        </p>

        {/* Action Button */}
        <Link
          to="/settings"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <span className="material-symbols-outlined">settings</span>
          Go to Settings
        </Link>

        {/* Helper Text */}
        <p className="text-gray-500 text-sm mt-6">
          After enabling the feature, navigate back to this page.
        </p>
      </div>
    </div>
  );
};

export default FeatureDisabled;
