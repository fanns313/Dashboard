'use client';

import React from 'react';

interface ServiceCardProps {
  icon: React.ReactNode;
  name: string;
  domain: string;
  colorClass: string;
  url: string;
}

export default function ServiceCard({ icon, name, domain, colorClass, url }: ServiceCardProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="service-card"
      id={`service-${name.toLowerCase().replace(/\s/g, '-')}`}
    >
      <div className={`service-card-icon ${colorClass}`}>{icon}</div>
      <div>
        <div className="service-card-name">{name}</div>
        <div className="service-card-domain">{domain}</div>
      </div>
    </a>
  );
}
