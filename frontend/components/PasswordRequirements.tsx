import React from 'react';

interface PasswordRequirementsProps {
  password: string;
  showRequirements?: boolean;
  className?: string;
}

/**
 * PasswordRequirements Component
 * 
 * Displays password validation requirements with visual indicators
 * showing which requirements are met and which are still needed.
 * 
 * @param password - The current password value to validate against
 * @param showRequirements - Whether to show the requirements (defaults to true)
 * @param className - Additional CSS classes for styling
 */
export default function PasswordRequirements({ 
  password, 
  showRequirements = true, 
  className = '' 
}: PasswordRequirementsProps) {
  if (!showRequirements) return null;

  const requirements = [
    {
      text: 'At least 8 characters',
      met: password.length >= 8,
      test: (pwd: string) => pwd.length >= 8
    },
    {
      text: 'One uppercase letter (A-Z)',
      met: /[A-Z]/.test(password),
      test: (pwd: string) => /[A-Z]/.test(pwd)
    },
    {
      text: 'One lowercase letter (a-z)',
      met: /[a-z]/.test(password),
      test: (pwd: string) => /[a-z]/.test(pwd)
    },
    {
      text: 'One number (0-9)',
      met: /\d/.test(password),
      test: (pwd: string) => /\d/.test(pwd)
    },
    {
      text: 'One special character (@$!%*?&)',
      met: /[@$!%*?&]/.test(password),
      test: (pwd: string) => /[@$!%*?&]/.test(pwd)
    }
  ];

  return (
    <div className={`mt-2 ${className}`}>
      <div className="text-xs text-gray-600 mb-2 font-medium">
        Password Requirements:
      </div>
      <ul className="space-y-1">
        {requirements.map((requirement, index) => (
          <li key={index} className="flex items-center text-xs">
            <div className={`w-4 h-4 mr-2 flex items-center justify-center rounded-full ${
              requirement.met 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-400'
            }`}>
              {requirement.met ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <div className="w-2 h-2 rounded-full bg-current" />
              )}
            </div>
            <span className={requirement.met ? 'text-green-600' : 'text-gray-500'}>
              {requirement.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
