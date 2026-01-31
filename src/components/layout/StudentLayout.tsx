import { AppShell } from "@/components/layout";

interface StudentLayoutProps {
  children: React.ReactNode;
}

export const StudentLayout = ({ children }: StudentLayoutProps) => {
  return (
    <AppShell userType="student" showSidebar={true} showTopBar={true}>
      <div className="container mx-auto px-4 py-6 lg:px-8 lg:py-8 max-w-7xl">
        {children}
      </div>
    </AppShell>
  );
};

export default StudentLayout;
