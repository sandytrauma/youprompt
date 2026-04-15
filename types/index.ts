export interface StatCardProps {
  title: string;
  // FIX: Allow null in the type definition to match Drizzle's output
  value: number | null | undefined; 
  icon: React.ReactNode;
  description?: string;
}