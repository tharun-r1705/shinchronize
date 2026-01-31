import { AppShell } from "@/components/layout";

interface RecruiterLayoutProps {
  children: React.ReactNode;
}

export const RecruiterLayout = ({ children }: RecruiterLayoutProps) => {
  return (
    <AppShell userType="recruiter" showSidebar={true} showTopBar={true}>
      <div className="container mx-auto px-4 py-6 lg:px-8 lg:py-8 max-w-7xl">
        {children}
      </div>
    </AppShell>
  );
};

export default RecruiterLayout;
