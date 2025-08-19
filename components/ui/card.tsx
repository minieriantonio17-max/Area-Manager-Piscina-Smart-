import React from "react";
export function Card({children, className=""}:{children: React.ReactNode; className?: string}) {
  return <div className={`card ${className}`}>{children}</div>;
}
export const CardHeader = ({children}:{children: React.ReactNode}) => <div className="mb-3">{children}</div>;
export const CardTitle = ({children}:{children: React.ReactNode}) => <h3 className="text-lg font-semibold">{children}</h3>;
export const CardContent = ({children}:{children: React.ReactNode}) => <div>{children}</div>;