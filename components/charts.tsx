
// @ts-nocheck
import dynamic from "next/dynamic";

export const BarChart = dynamic(() => import("recharts").then(m => m.BarChart), { ssr: false }) as any;
export const Bar = dynamic(() => import("recharts").then(m => m.Bar), { ssr: false }) as any;
export const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false }) as any;
export const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false }) as any;
export const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false }) as any;
export const Legend = dynamic(() => import("recharts").then(m => m.Legend), { ssr: false }) as any;
export const CartesianGrid = dynamic(() => import("recharts").then(m => m.CartesianGrid), { ssr: false }) as any;
export const LineChart = dynamic(() => import("recharts").then(m => m.LineChart), { ssr: false }) as any;
export const Line = dynamic(() => import("recharts").then(m => m.Line), { ssr: false }) as any;
export const PieChart = dynamic(() => import("recharts").then(m => m.PieChart), { ssr: false }) as any;
export const Pie = dynamic(() => import("recharts").then(m => m.Pie), { ssr: false }) as any;
export const Cell = dynamic(() => import("recharts").then(m => m.Cell), { ssr: false }) as any;
