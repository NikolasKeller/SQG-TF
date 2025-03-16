import React from 'react';

export const DryftLogo: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 300 300" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="47" y="47" width="100" height="30" rx="15" fill="#4DA8FF" />
      <rect x="167" y="47" width="80" height="30" rx="15" fill="#4DA8FF" />
      <rect x="87" y="107" width="140" height="30" rx="15" fill="#4DA8FF" />
      <rect x="127" y="167" width="80" height="30" rx="15" fill="#4DA8FF" />
      <rect x="227" y="167" width="30" height="30" rx="15" fill="#4DA8FF" />
      <rect x="47" y="167" width="60" height="30" rx="15" fill="#4DA8FF" />
      <rect x="47" y="227" width="120" height="30" rx="15" fill="#4DA8FF" />
      <rect x="187" y="227" width="30" height="30" rx="15" fill="#4DA8FF" />
    </svg>
  );
};

export default DryftLogo; 