import React, { HTMLAttributes } from "react";

type DivProps = HTMLAttributes<HTMLDivElement> & { className?: string; children: React.ReactNode };

export function Card({children, className="", ...props}: DivProps) {
  return <div className={`card ${className}`} {...props}>{children}</div>;
}
export function CardHeader({children, className="", ...props}: DivProps) {
  return <div className={`mb-3 ${className}`} {...props}>{children}</div>;
}
export function CardTitle({children, className="", ...props}: DivProps) {
  return <h3 className={`text-lg font-semibold ${className}`} {...props}>{children}</h3>;
}
export function CardContent({children, className="", ...props}: DivProps) {
  return <div className={className} {...props}>{children}</div>;
}